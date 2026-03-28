import type { ImpactEvent, Persona } from "@/lib/domain";

/** Structured narrative from Gemini; merged over curated/rule-based text when valid. */
export type AiEventFeedback = {
  whatWeKnow: string[];
  whatWeInfer: string[];
  indiaImpact: string;
  localNotes?: Record<string, string>;
  actionsByPersona?: Partial<Record<Persona, string[]>>;
};

export type ImpactEventForPrompt = Pick<
  ImpactEvent,
  | "slug"
  | "title"
  | "category"
  | "severity"
  | "horizon"
  | "whatWeKnow"
  | "whatWeInfer"
  | "indiaImpact"
  | "mostAffectedPersonas"
  | "provenance"
> & {
  localNotesKeys: string[];
  citationSummary: string;
};
