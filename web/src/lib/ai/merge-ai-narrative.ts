import type { ImpactEvent, Persona } from "@/lib/domain";
import type { AiEventFeedback } from "./types";

const PERSONA_SET = new Set<Persona>([
  "commuter",
  "student",
  "small_business_owner",
  "farmer",
  "importer",
]);

export function coerceAiEventFeedback(raw: unknown): AiEventFeedback | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const wkRaw = o.whatWeKnow;
  const wiRaw = o.whatWeInfer;
  if (wkRaw !== undefined && !Array.isArray(wkRaw)) return null;
  if (wiRaw !== undefined && !Array.isArray(wiRaw)) return null;
  const wk = (Array.isArray(wkRaw) ? wkRaw : [])
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);
  const wi = (Array.isArray(wiRaw) ? wiRaw : [])
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);
  const ii =
    typeof o.indiaImpact === "string" ? o.indiaImpact.trim() : "";

  let localNotes: Record<string, string> | undefined;
  if (
    o.localNotes &&
    typeof o.localNotes === "object" &&
    !Array.isArray(o.localNotes)
  ) {
    const ln: Record<string, string> = {};
    for (const [k, v] of Object.entries(o.localNotes)) {
      if (typeof v === "string" && v.trim()) ln[k.trim().toLowerCase()] = v.trim();
    }
    if (Object.keys(ln).length > 0) localNotes = ln;
  }

  let actionsByPersona: Partial<Record<Persona, string[]>> | undefined;
  if (
    o.actionsByPersona &&
    typeof o.actionsByPersona === "object" &&
    !Array.isArray(o.actionsByPersona)
  ) {
    const ap: Partial<Record<Persona, string[]>> = {};
    for (const [k, v] of Object.entries(o.actionsByPersona)) {
      if (!PERSONA_SET.has(k as Persona)) continue;
      if (!Array.isArray(v)) continue;
      const lines = v
        .filter((x): x is string => typeof x === "string")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 6);
      if (lines.length) ap[k as Persona] = lines;
    }
    if (Object.keys(ap).length > 0) actionsByPersona = ap;
  }

  const hasNarrative = wk.length > 0 || wi.length > 0 || ii.length > 0;
  const hasExtra =
    (localNotes && Object.keys(localNotes).length > 0) ||
    (actionsByPersona && Object.keys(actionsByPersona).length > 0);
  if (!hasNarrative && !hasExtra) return null;

  return {
    whatWeKnow: wk,
    whatWeInfer: wi,
    indiaImpact: ii,
    localNotes,
    actionsByPersona,
  };
}

/** Prefer Gemini output per field when present; curated / rule-based text remains as fallback. */
export function mergeAiPreferredNarrative(
  event: ImpactEvent,
  ai: AiEventFeedback | null,
): ImpactEvent {
  if (!ai) return event;
  const refined =
    ai.whatWeKnow.length > 0 ||
    ai.whatWeInfer.length > 0 ||
    ai.indiaImpact.trim().length > 0 ||
    (ai.localNotes && Object.keys(ai.localNotes).length > 0) ||
    (ai.actionsByPersona && Object.keys(ai.actionsByPersona).length > 0);
  if (!refined) return event;

  const aiRefinedFields = {
    ...(ai.whatWeKnow.length > 0 ? { whatWeKnow: true as const } : {}),
    ...(ai.whatWeInfer.length > 0 ? { whatWeInfer: true as const } : {}),
    ...(ai.indiaImpact.trim().length > 0
      ? { indiaImpact: true as const }
      : {}),
    ...(ai.localNotes && Object.keys(ai.localNotes).length > 0
      ? { localNotes: true as const }
      : {}),
    ...(ai.actionsByPersona && Object.keys(ai.actionsByPersona).length > 0
      ? { actionsByPersona: true as const }
      : {}),
  };

  return {
    ...event,
    whatWeKnow:
      ai.whatWeKnow.length > 0 ? ai.whatWeKnow : event.whatWeKnow,
    whatWeInfer:
      ai.whatWeInfer.length > 0 ? ai.whatWeInfer : event.whatWeInfer,
    indiaImpact:
      ai.indiaImpact.trim().length > 0
        ? ai.indiaImpact
        : event.indiaImpact,
    localNotes:
      ai.localNotes && Object.keys(ai.localNotes).length > 0
        ? { ...event.localNotes, ...ai.localNotes }
        : event.localNotes,
    actionsByPersona:
      ai.actionsByPersona && Object.keys(ai.actionsByPersona).length > 0
        ? { ...event.actionsByPersona, ...ai.actionsByPersona }
        : event.actionsByPersona,
    narrativeRefinedWithGemini: true,
    aiRefinedFields,
  };
}
