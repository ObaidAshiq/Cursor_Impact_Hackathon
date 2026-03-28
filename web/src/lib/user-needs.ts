import type {
  ConfidenceLevel,
  ImpactEvent,
  Persona,
  UserNeedCard,
  UserNeedType,
  UserNeedUrgency,
} from "@/lib/domain";
import type { EventListFilters } from "@/lib/events";
import { localBlurbForRegion } from "@/lib/events";

const confidenceRank: Record<ConfidenceLevel, number> = {
  insufficient: 0,
  low: 1,
  medium: 2,
  high: 3,
};

const urgencyRank: Record<UserNeedUrgency, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

const provenanceRank: Record<NonNullable<ImpactEvent["provenance"]>, number> = {
  eia: 4,
  reliefweb: 3,
  apify: 2,
  curated: 1,
};

export const personaLabels: Record<Persona, string> = {
  commuter: "Commuter",
  student: "Student",
  small_business_owner: "Small business owner",
  farmer: "Farmer",
  importer: "Importer",
};

export const urgencyLabels: Record<UserNeedUrgency, string> = {
  low: "Plan ahead",
  medium: "Watch this week",
  high: "Act soon",
};

export type UserNeedFilters = EventListFilters & {
  region?: string;
};

function toNeedType(event: ImpactEvent, persona: Persona): UserNeedType {
  switch (persona) {
    case "commuter":
      return event.category === "economic_policy" ? "credit_planning" : "fuel_cost";
    case "student":
      return event.category === "food_supply_chain"
        ? "food_budget"
        : "credit_planning";
    case "small_business_owner":
      return "business_operations";
    case "farmer":
      return "farm_planning";
    case "importer":
      return "trade_operations";
  }
}

function toUrgency(event: ImpactEvent): UserNeedUrgency {
  if (event.horizon === "immediate" || event.severity >= 4) return "high";
  if (event.horizon === "days" || event.severity >= 3) return "medium";
  return "low";
}

function conservativeConfidence(event: ImpactEvent): ConfidenceLevel {
  return confidenceRank[event.factsConfidence] <= confidenceRank[event.inferConfidence]
    ? event.factsConfidence
    : event.inferConfidence;
}

function titleFor(event: ImpactEvent, persona: Persona): string {
  return `For ${personaLabels[persona].toLowerCase()}: ${event.title}`;
}

function summaryFor(event: ImpactEvent, regionBlurb: string | null): string {
  return regionBlurb ?? event.whatWeKnow[0] ?? event.indiaImpact;
}

function fallbackActions(event: ImpactEvent, persona: Persona): string[] {
  switch (persona) {
    case "commuter":
      return [
        "Watch official local advisories before changing travel or fuel-buying plans.",
      ];
    case "student":
      return [
        "Use primary sources and budget for gradual changes rather than reacting to a headline alone.",
      ];
    case "small_business_owner":
      return [
        "Confirm supplier, freight, and financing changes before repricing or changing delivery promises.",
      ];
    case "farmer":
      return [
        "Check ministry, mandi, or procurement notices before making buying or selling decisions.",
      ];
    case "importer":
      return [
        "Review shipping, customs, and currency exposure before treating the signal as an operational change.",
      ];
  }
}

function whyItMattersFor(event: ImpactEvent): string {
  return event.whatWeInfer[0] || event.whatWeKnow[0] || event.indiaImpact;
}

export function mapImpactEventToUserNeeds(
  event: ImpactEvent,
  filters: UserNeedFilters = {},
): UserNeedCard[] {
  const { persona = "all", region } = filters;
  const personas =
    persona === "all"
      ? event.mostAffectedPersonas
      : event.mostAffectedPersonas.filter((value) => value === persona);
  const regionBlurb = localBlurbForRegion(event, region);

  return personas.map((value) => ({
    id: `${event.slug}:${value}`,
    sourceEventSlug: event.slug,
    sourceEventTitle: event.title,
    persona: value,
    category: event.category,
    needType: toNeedType(event, value),
    title: titleFor(event, value),
    summary: summaryFor(event, regionBlurb),
    whyItMatters: whyItMattersFor(event),
    recommendedActions:
      event.actionsByPersona[value] && event.actionsByPersona[value]!.length > 0
        ? event.actionsByPersona[value]!
        : fallbackActions(event, value),
    urgency: toUrgency(event),
    confidence: conservativeConfidence(event),
    region: region?.trim().toLowerCase() || undefined,
    regionBlurb: regionBlurb ?? undefined,
    updatedAt: event.updatedAt,
    provenance: event.provenance,
    citations: event.citations,
    severity: event.severity,
    horizon: event.horizon,
    factsConfidence: event.factsConfidence,
    inferConfidence: event.inferConfidence,
    narrativeRefinedWithGemini: event.narrativeRefinedWithGemini,
    aiRefinedFields: event.aiRefinedFields,
    aiError: event.aiError,
  }));
}

export function rankUserNeeds(
  needs: readonly UserNeedCard[],
  filters: UserNeedFilters = {},
): UserNeedCard[] {
  const requestedPersona = filters.persona;
  return [...needs].sort((left, right) => {
    const personaDelta =
      Number(right.persona === requestedPersona) - Number(left.persona === requestedPersona);
    if (personaDelta !== 0) return personaDelta;

    const urgencyDelta = urgencyRank[right.urgency] - urgencyRank[left.urgency];
    if (urgencyDelta !== 0) return urgencyDelta;

    const regionDelta = Number(Boolean(right.regionBlurb)) - Number(Boolean(left.regionBlurb));
    if (regionDelta !== 0) return regionDelta;

    const freshnessDelta =
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    if (freshnessDelta !== 0) return freshnessDelta;

    const provenanceDelta =
      (right.provenance ? provenanceRank[right.provenance] : 0) -
      (left.provenance ? provenanceRank[left.provenance] : 0);
    if (provenanceDelta !== 0) return provenanceDelta;

    return left.id.localeCompare(right.id);
  });
}

export function buildUserNeedsFromEvents(
  events: readonly ImpactEvent[],
  filters: UserNeedFilters = {},
): UserNeedCard[] {
  return rankUserNeeds(
    events.flatMap((event) => mapImpactEventToUserNeeds(event, filters)),
    filters,
  );
}

export function resolveUserNeedFromEvent(
  event: ImpactEvent,
  filters: Pick<UserNeedFilters, "persona" | "region"> = {},
): UserNeedCard {
  const needs = mapImpactEventToUserNeeds(event, filters);
  if (needs.length > 0) return rankUserNeeds(needs, filters)[0];

  return {
    ...mapImpactEventToUserNeeds(event, { persona: "all", region: filters.region })[0],
  };
}
