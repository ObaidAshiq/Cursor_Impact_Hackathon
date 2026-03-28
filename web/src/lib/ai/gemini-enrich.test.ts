import { afterEach, describe, expect, it, vi } from "vitest";
import type { ImpactEvent } from "@/lib/domain";

const baseEvent: ImpactEvent = {
  slug: "gemini-test",
  title: "Gemini Test",
  category: "economic_policy",
  severity: 3,
  horizon: "days",
  updatedAt: new Date().toISOString(),
  whatWeKnow: ["Baseline fact"],
  whatWeInfer: ["Baseline inference"],
  indiaImpact: "Baseline India impact",
  mostAffectedPersonas: ["student"],
  citations: [],
  factsConfidence: "high",
  inferConfidence: "medium",
  actionsByPersona: { student: ["Baseline action"] },
};

function jsonResponse() {
  return {
    response: {
      text: () =>
        JSON.stringify({
          whatWeKnow: ["AI fact"],
          whatWeInfer: ["AI inference"],
          indiaImpact: "AI India impact",
        }),
    },
  };
}

async function loadSubjectWithMocks(options: {
  configuredModel: string;
  listedModels?: string[];
  generateContent: (modelId: string) => Promise<unknown>;
}) {
  vi.resetModules();
  process.env.GEMINI_API_KEY = "test-key";
  process.env.GEMINI_MODEL = options.configuredModel;
  process.env.GEMINI_USE_CACHE = "0";
  process.env.DISABLE_GEMINI = "0";

  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        models: (options.listedModels ?? []).map((name) => ({
          name: `models/${name}`,
          supportedGenerationMethods: ["generateContent"],
        })),
      }),
    }),
  );

  const getGenerativeModel = vi.fn(({ model }: { model: string }) => ({
    generateContent: () => options.generateContent(model),
  }));

  vi.doMock("@google/generative-ai", () => ({
    GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
      getGenerativeModel,
    })),
  }));

  const subject = await import("./gemini-enrich");
  return { ...subject, getGenerativeModel };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_MODEL;
  delete process.env.GEMINI_USE_CACHE;
  delete process.env.DISABLE_GEMINI;
});

describe("fetchGeminiEventFeedback", () => {
  it("filters out audio-only Gemini models before calling the SDK", async () => {
    const { fetchGeminiEventFeedback, getGenerativeModel } =
      await loadSubjectWithMocks({
        configuredModel: "gemini-2.5-flash-preview-tts",
        listedModels: ["gemini-2.5-flash-preview-tts", "gemini-2.0-flash"],
        generateContent: async (modelId) => {
          if (modelId === "gemini-2.0-flash") return jsonResponse();
          throw new Error(`unexpected model ${modelId}`);
        },
      });

    const result = await fetchGeminiEventFeedback(baseEvent);

    expect(result.feedback?.indiaImpact).toBe("AI India impact");
    expect(result.modelId).toBe("gemini-2.0-flash");
    expect(getGenerativeModel).toHaveBeenCalledTimes(1);
    expect(getGenerativeModel).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gemini-2.0-flash" }),
    );
  });

  it("does not retry plain mode after a quota error", async () => {
    const calls: string[] = [];
    const { fetchGeminiEventFeedback } = await loadSubjectWithMocks({
      configuredModel: "gemini-2.5-flash",
      listedModels: [],
      generateContent: async (modelId) => {
        calls.push(modelId);
        if (modelId === "gemini-2.5-flash") {
          throw new Error("429 Too Many Requests: quota exceeded");
        }
        if (modelId === "gemini-2.0-flash") return jsonResponse();
        throw new Error(`unexpected model ${modelId}`);
      },
    });

    const result = await fetchGeminiEventFeedback(baseEvent);

    expect(result.feedback?.indiaImpact).toBe("AI India impact");
    expect(result.modelId).toBe("gemini-2.0-flash");
    expect(calls.filter((modelId) => modelId === "gemini-2.5-flash")).toHaveLength(1);
  });
});
