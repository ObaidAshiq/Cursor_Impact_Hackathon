import { describe, expect, it } from "vitest";
import type { ImpactEvent } from "@/lib/domain";
import {
  coerceAiEventFeedback,
  mergeAiPreferredNarrative,
} from "./merge-ai-narrative";

const base: ImpactEvent = {
  slug: "test",
  title: "Test",
  category: "economic_policy",
  severity: 3,
  horizon: "days",
  updatedAt: new Date().toISOString(),
  whatWeKnow: ["A"],
  whatWeInfer: ["B"],
  indiaImpact: "C",
  mostAffectedPersonas: ["student"],
  citations: [],
  factsConfidence: "high",
  inferConfidence: "medium",
  actionsByPersona: { student: ["Old"] },
};

describe("coerceAiEventFeedback", () => {
  it("returns null for invalid payloads", () => {
    expect(coerceAiEventFeedback(null)).toBeNull();
    expect(coerceAiEventFeedback({})).toBeNull();
  });

  it("accepts a minimal valid object", () => {
    const ai = coerceAiEventFeedback({
      whatWeKnow: ["x"],
      whatWeInfer: ["y"],
      indiaImpact: "z",
    });
    expect(ai).toEqual({
      whatWeKnow: ["x"],
      whatWeInfer: ["y"],
      indiaImpact: "z",
      localNotes: undefined,
      actionsByPersona: undefined,
    });
  });

  it("accepts indiaImpact when arrays are omitted", () => {
    const ai = coerceAiEventFeedback({ indiaImpact: "India paragraph only" });
    expect(ai?.indiaImpact).toBe("India paragraph only");
    expect(ai?.whatWeKnow).toEqual([]);
    expect(ai?.whatWeInfer).toEqual([]);
  });
});

describe("mergeAiPreferredNarrative", () => {
  it("leaves event unchanged when ai is null", () => {
    expect(mergeAiPreferredNarrative(base, null)).toEqual(base);
  });

  it("prefers AI fields when present", () => {
    const merged = mergeAiPreferredNarrative(base, {
      whatWeKnow: ["AI know"],
      whatWeInfer: ["AI infer"],
      indiaImpact: "AI india",
      localNotes: { mumbai: "AI mumbai" },
      actionsByPersona: { student: ["AI step"] },
    });
    expect(merged.whatWeKnow).toEqual(["AI know"]);
    expect(merged.whatWeInfer).toEqual(["AI infer"]);
    expect(merged.indiaImpact).toBe("AI india");
    expect(merged.localNotes).toEqual({ mumbai: "AI mumbai" });
    expect(merged.actionsByPersona.student).toEqual(["AI step"]);
    expect(merged.narrativeRefinedWithGemini).toBe(true);
    expect(merged.aiRefinedFields).toEqual({
      whatWeKnow: true,
      whatWeInfer: true,
      indiaImpact: true,
      localNotes: true,
      actionsByPersona: true,
    });
  });

  it("falls back per field when AI omits content", () => {
    const merged = mergeAiPreferredNarrative(base, {
      whatWeKnow: [],
      whatWeInfer: [],
      indiaImpact: "",
      actionsByPersona: { student: ["Only actions"] },
    });
    expect(merged.whatWeKnow).toEqual(["A"]);
    expect(merged.whatWeInfer).toEqual(["B"]);
    expect(merged.indiaImpact).toBe("C");
    expect(merged.actionsByPersona.student).toEqual(["Only actions"]);
    expect(merged.narrativeRefinedWithGemini).toBe(true);
    expect(merged.aiRefinedFields).toEqual({ actionsByPersona: true });
  });
});
