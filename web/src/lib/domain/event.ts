export type EventCategory =
  | "energy_fuel"
  | "food_supply_chain"
  | "economic_policy";

export type ConfidenceLevel =
  | "high"
  | "medium"
  | "low"
  | "insufficient";

export type Persona =
  | "commuter"
  | "student"
  | "small_business_owner"
  | "farmer"
  | "importer";

export type CitationKind =
  | "official"
  | "multilateral"
  | "media"
  | "data";

export type Citation = {
  id: string;
  title: string;
  url: string;
  publisher: string;
  retrievedAt: string;
  kind: CitationKind;
};

export type TimeHorizon = "immediate" | "days" | "weeks" | "months";

/** Curated examples vs live Apify news / ReliefWeb / U.S. EIA data. */
export type EventProvenance = "curated" | "apify" | "reliefweb" | "eia";

/** Which narrative blocks were replaced by AI (Gemini); omitted keys mean baseline copy. */
export type AiRefinedFields = Partial<
  Record<
    | "whatWeKnow"
    | "whatWeInfer"
    | "indiaImpact"
    | "localNotes"
    | "actionsByPersona",
    true
  >
>;

export type ImpactEvent = {
  slug: string;
  title: string;
  category: EventCategory;
  severity: 1 | 2 | 3 | 4 | 5;
  horizon: TimeHorizon;
  updatedAt: string;
  whatWeKnow: string[];
  whatWeInfer: string[];
  indiaImpact: string;
  /** Optional per-region blurbs (lowercase keys, e.g. mumbai). */
  localNotes?: Record<string, string>;
  mostAffectedPersonas: Persona[];
  citations: Citation[];
  factsConfidence: ConfidenceLevel;
  inferConfidence: ConfidenceLevel;
  actionsByPersona: Partial<Record<Persona, string[]>>;
  provenance?: EventProvenance;
  /** Source-specific id (e.g. ReliefWeb report id, EIA series key). */
  externalId?: string;
  /** True when any narrative field was replaced using Gemini (baseline copy kept as model input). */
  narrativeRefinedWithGemini?: boolean;
  /** Per-block detail for UI markers; set together with narrativeRefinedWithGemini when AI ran. */
  aiRefinedFields?: AiRefinedFields;
  /** Present when Gemini was attempted but unavailable or returned unusable output. */
  aiError?: string;
  /** Gemini model that produced the current AI-assisted narrative. */
  aiModel?: string;
};
