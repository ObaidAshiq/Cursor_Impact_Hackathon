import {
  GoogleGenerativeAI,
  type GenerateContentResult,
} from "@google/generative-ai";
import type { ImpactEvent } from "@/lib/domain";
import {
  coerceAiEventFeedback,
  mergeAiPreferredNarrative,
} from "./merge-ai-narrative";
import type { AiEventFeedback, ImpactEventForPrompt } from "./types";

type GeminiCallResult = {
  feedback: AiEventFeedback | null;
  error?: string;
  modelId?: string;
};

type GeminiModelListResponse = {
  models?: Array<{
    name?: string;
    supportedGenerationMethods?: string[];
  }>;
};

const STATIC_FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-001",
  "gemini-1.5-flash-002",
  "gemini-1.5-flash",
];

const MODEL_LIST_URL =
  "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000";
const MODEL_QUOTA_BACKOFF_MS = 1000 * 60 * 15;
const NON_TEXT_MODEL_TOKENS = ["tts", "audio", "speech", "transcribe", "embed"];

const promptCache = new Map<
  string,
  { expiresAt: number; result: GeminiCallResult }
>();
const promptInFlight = new Map<string, Promise<GeminiCallResult>>();
const modelListCache = new Map<string, { expiresAt: number; ids: string[] }>();
const modelQuotaBackoff = new Map<string, number>();

function geminiApiKey(): string | undefined {
  const a = process.env.GEMINI_API_KEY?.trim();
  const b = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  return a || b || undefined;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function isGeminiEnabled(): boolean {
  if (process.env.DISABLE_GEMINI === "1") return false;
  return Boolean(geminiApiKey());
}

function logGeminiDev(phase: string, err: unknown) {
  if (process.env.NODE_ENV !== "development") return;
  const msg = errorMessage(err);
  console.error(`[gemini-enrich:${phase}]`, msg);
}

function cacheSeconds(kind: "success" | "error"): number {
  const raw = process.env.GEMINI_CACHE_SECONDS?.trim();
  const parsed = raw ? Number(raw) : NaN;
  if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  if (kind === "error") return 30;
  return process.env.NODE_ENV === "development" ? 60 : 3600;
}

function shouldUsePromptCache(): boolean {
  return process.env.GEMINI_USE_CACHE !== "0";
}

function extractJsonObjectFromText(raw: string): string {
  const t = raw.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)```/m.exec(t);
  const inner = fenced?.[1]?.trim();
  if (inner) return inner;
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start !== -1 && end > start) return t.slice(start, end + 1);
  return t;
}

function readGeneratedText(res: GenerateContentResult): string {
  try {
    return res.response.text();
  } catch {
    const parts = res.response.candidates?.[0]?.content?.parts;
    if (!parts?.length) return "";
    return parts
      .map((p) =>
        p && typeof p === "object" && "text" in p && typeof p.text === "string"
          ? p.text
          : "",
      )
      .join("");
  }
}

function buildPromptPayload(event: ImpactEvent): ImpactEventForPrompt {
  return {
    slug: event.slug,
    title: event.title,
    category: event.category,
    severity: event.severity,
    horizon: event.horizon,
    whatWeKnow: event.whatWeKnow,
    whatWeInfer: event.whatWeInfer,
    indiaImpact: event.indiaImpact,
    mostAffectedPersonas: event.mostAffectedPersonas,
    provenance: event.provenance,
    localNotesKeys: event.localNotes ? Object.keys(event.localNotes) : [],
    citationSummary: event.citations
      .slice(0, 5)
      .map((c) => `${c.publisher}: ${c.title} (${c.url})`)
      .join("\n"),
  };
}

const INSTRUCTIONS = `You refine impact-event copy for readers in India. You receive JSON with our baseline narrative (curated or derived from ReliefWeb/EIA) plus citation lines.

Respond with ONLY valid JSON (no markdown) matching this shape:
{
  "whatWeKnow": string[],
  "whatWeInfer": string[],
  "indiaImpact": string,
  "localNotes"?: Record<string, string>,
  "actionsByPersona"?: Partial<Record<"commuter"|"student"|"small_business_owner"|"farmer"|"importer", string[]>>
}

Rules:
- 2–5 whatWeKnow bullets: factual, tied to the supplied sources; no invented statistics.
- 1–3 whatWeInfer bullets: cautious, conditional language; no false certainty.
- indiaImpact: one short paragraph on plausible links for India (trade, energy, food, remittances, travel), without alarmism.
- localNotes: only if useful; keys lowercase city names (e.g. mumbai, delhi, bengaluru). Omit if not relevant.
- actionsByPersona: optional 2–4 practical steps per persona we list in mostAffectedPersonas; prioritize verification with official channels.
- Do not claim legal, medical, or emergency instructions; encourage checking official sources for urgent matters.`;

function classifyGeminiError(err: unknown): string {
  const msg = errorMessage(err);
  const text = msg.toLowerCase();
  if (text.includes("429") || text.includes("quota")) {
    return "Gemini quota exceeded. Check Google AI Studio billing/quota or wait and retry.";
  }
  if (
    text.includes("response modalities") ||
    text.includes("accepts the following combination of response modalities")
  ) {
    return "Configured Gemini model does not support text responses. Use a text-capable flash/pro model instead.";
  }
  if (text.includes("404") || text.includes("not found")) {
    return "Gemini model unavailable for this API key. Update GEMINI_MODEL or use the Gemini test script to inspect available models.";
  }
  if (text.includes("api key")) {
    return "Gemini API key was rejected. Verify GEMINI_API_KEY and the Google AI Studio project.";
  }
  if (text.includes("permission") || text.includes("403")) {
    return "Gemini access was denied for this project. Check API permissions and billing.";
  }
  return "Gemini did not return usable feedback. Showing the baseline text instead.";
}

function isQuotaError(err: unknown): boolean {
  const text = errorMessage(err).toLowerCase();
  return text.includes("429") || text.includes("quota");
}

function isUnsupportedTextResponseError(err: unknown): boolean {
  const text = errorMessage(err).toLowerCase();
  return (
    text.includes("response modalities") ||
    text.includes("text) is not supported")
  );
}

function isTextCapableGeminiModelId(modelId: string): boolean {
  const id = modelId.trim().toLowerCase();
  return (
    id.startsWith("gemini") &&
    !NON_TEXT_MODEL_TOKENS.some((token) => id.includes(token))
  );
}

function shouldSkipPlainFallback(err: unknown): boolean {
  return isQuotaError(err) || isUnsupportedTextResponseError(err);
}

function markModelQuotaBackoff(modelId: string, err: unknown) {
  if (!isQuotaError(err)) return;
  modelQuotaBackoff.set(modelId, Date.now() + MODEL_QUOTA_BACKOFF_MS);
}

function isModelAvailable(modelId: string): boolean {
  const until = modelQuotaBackoff.get(modelId);
  return !until || until <= Date.now();
}

function parseFeedbackFromResult(res: GenerateContentResult): AiEventFeedback | null {
  const raw = readGeneratedText(res);
  if (!raw.trim()) {
    logGeminiDev("empty-response", new Error("No text in Gemini response"));
    return null;
  }
  const slice = extractJsonObjectFromText(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(slice) as unknown;
  } catch (e) {
    logGeminiDev("json-parse", e);
    return null;
  }
  const feedback = coerceAiEventFeedback(parsed);
  if (!feedback && process.env.NODE_ENV === "development") {
    console.error(
      "[gemini-enrich:coerce] Model JSON did not match expected shape:",
      slice.slice(0, 500),
    );
  }
  return feedback;
}

async function listSupportedModelIds(): Promise<string[]> {
  const key = geminiApiKey();
  if (!key) return [];

  const cached = modelListCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.ids;

  try {
    const res = await fetch(`${MODEL_LIST_URL}&key=${encodeURIComponent(key)}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Model list request failed: ${res.status} ${res.statusText}`);
    }
    const json = (await res.json()) as GeminiModelListResponse;
    const ids =
      json.models
        ?.filter((model) =>
          model.supportedGenerationMethods?.includes("generateContent"),
        )
        .map((model) => model.name?.replace(/^models\//, ""))
        .filter(
          (id): id is string => Boolean(id && isTextCapableGeminiModelId(id)),
        )
        .sort((a, b) => rankModelId(a) - rankModelId(b)) ?? [];
    modelListCache.set(key, {
      expiresAt: Date.now() + 1000 * 60 * 60,
      ids,
    });
    return ids;
  } catch (err) {
    logGeminiDev("list-models", err);
    return [];
  }
}

function rankModelId(modelId: string): number {
  const id = modelId.toLowerCase();
  if (id.includes("2.5") && id.includes("flash")) return 0;
  if (id.includes("2.0") && id.includes("flash")) return 1;
  if (id.includes("1.5") && id.includes("flash")) return 2;
  if (id.includes("flash")) return 3;
  if (id.includes("pro")) return 4;
  return 5;
}

async function resolveCandidateModelIds(): Promise<string[]> {
  const configured = process.env.GEMINI_MODEL?.trim();
  const discovered = await listSupportedModelIds();
  const combined = [
    configured,
    ...discovered,
    ...STATIC_FALLBACK_MODELS,
  ].filter((id): id is string => Boolean(id));

  return combined.filter(
    (id, index) =>
      combined.indexOf(id) === index &&
      isTextCapableGeminiModelId(id) &&
      isModelAvailable(id),
  );
}

async function generateWithModel(
  genAI: GoogleGenerativeAI,
  modelId: string,
  prompt: string,
  jsonMode: boolean,
): Promise<AiEventFeedback | null> {
  const model = genAI.getGenerativeModel({
    model: modelId,
    generationConfig: jsonMode
      ? {
          temperature: 0.35,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        }
      : {
          temperature: 0.35,
          maxOutputTokens: 2048,
        },
  });
  const res = await model.generateContent(prompt);
  return parseFeedbackFromResult(res);
}

async function callGeminiJson(payloadJson: string): Promise<GeminiCallResult> {
  const key = geminiApiKey();
  if (!key) return { feedback: null };

  const modelIds = await resolveCandidateModelIds();
  if (!modelIds.length) {
    return {
      feedback: null,
      error:
        "No text-capable Gemini models are currently available. Check GEMINI_MODEL, quota, or try again later.",
    };
  }
  const genAI = new GoogleGenerativeAI(key);
  const userPrompt = `${INSTRUCTIONS}\n\nBaseline event JSON:\n${payloadJson}`;
  let lastError: string | undefined;

  for (const modelId of modelIds) {
    try {
      const feedback = await generateWithModel(genAI, modelId, userPrompt, true);
      if (feedback) return { feedback, modelId };
    } catch (err) {
      logGeminiDev(`model:${modelId}:json-mode`, err);
      markModelQuotaBackoff(modelId, err);
      lastError = classifyGeminiError(err);
      if (shouldSkipPlainFallback(err)) continue;
    }

    try {
      const plainPrompt = `${userPrompt}\n\nOutput: respond with a single raw JSON object only. No markdown code fences.`;
      const feedback = await generateWithModel(
        genAI,
        modelId,
        plainPrompt,
        false,
      );
      if (feedback) return { feedback, modelId };
    } catch (err) {
      logGeminiDev(`model:${modelId}:plain`, err);
      markModelQuotaBackoff(modelId, err);
      lastError = classifyGeminiError(err);
    }
  }

  return {
    feedback: null,
    error:
      lastError ??
      "Gemini returned no parseable feedback. Showing the curated text instead.",
  };
}

async function runPromptWithCache(payloadJson: string): Promise<GeminiCallResult> {
  if (!shouldUsePromptCache()) return callGeminiJson(payloadJson);

  const cached = promptCache.get(payloadJson);
  if (cached && cached.expiresAt > Date.now()) return cached.result;

  const existing = promptInFlight.get(payloadJson);
  if (existing) return existing;

  const promise = callGeminiJson(payloadJson)
    .then((result) => {
      const ttlMs =
        1000 *
        cacheSeconds(result.feedback ? "success" : "error");
      promptCache.set(payloadJson, {
        expiresAt: Date.now() + ttlMs,
        result,
      });
      return result;
    })
    .finally(() => {
      promptInFlight.delete(payloadJson);
    });

  promptInFlight.set(payloadJson, promise);
  return promise;
}

export async function fetchGeminiEventFeedback(
  event: ImpactEvent,
): Promise<GeminiCallResult> {
  if (!isGeminiEnabled()) return { feedback: null };
  const payload = JSON.stringify(buildPromptPayload(event));
  try {
    return await runPromptWithCache(payload);
  } catch (err) {
    logGeminiDev("fetch", err);
    return {
      feedback: null,
      error: classifyGeminiError(err),
    };
  }
}

export async function enrichEventWithGemini(
  event: ImpactEvent,
): Promise<ImpactEvent> {
  const result = await fetchGeminiEventFeedback(event);
  if (result.feedback) {
    return {
      ...mergeAiPreferredNarrative(event, result.feedback),
      aiError: undefined,
      aiModel: result.modelId,
    };
  }
  if (result.error) {
    return {
      ...event,
      aiError: result.error,
    };
  }
  return event;
}
