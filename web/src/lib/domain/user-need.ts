import type {
  AiRefinedFields,
  Citation,
  ConfidenceLevel,
  EventCategory,
  EventProvenance,
  ImpactEvent,
  Persona,
  TimeHorizon,
} from "./event";

export type UserNeedType =
  | "fuel_cost"
  | "food_budget"
  | "credit_planning"
  | "business_operations"
  | "farm_planning"
  | "trade_operations";

export type UserNeedUrgency = "low" | "medium" | "high";

export type UserNeedCard = {
  id: string;
  sourceEventSlug: string;
  sourceEventTitle: string;
  persona: Persona;
  category: EventCategory;
  needType: UserNeedType;
  title: string;
  summary: string;
  whyItMatters: string;
  recommendedActions: string[];
  urgency: UserNeedUrgency;
  confidence: ConfidenceLevel;
  region?: string;
  regionBlurb?: string;
  updatedAt: string;
  provenance?: EventProvenance;
  citations: Citation[];
  severity: ImpactEvent["severity"];
  horizon: TimeHorizon;
  factsConfidence: ConfidenceLevel;
  inferConfidence: ConfidenceLevel;
  narrativeRefinedWithGemini?: boolean;
  aiRefinedFields?: AiRefinedFields;
  aiError?: string;
};
