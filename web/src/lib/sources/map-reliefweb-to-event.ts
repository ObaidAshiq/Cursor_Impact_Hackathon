import type {
  EventCategory,
  ConfidenceLevel,
  ImpactEvent,
  Persona,
  TimeHorizon,
} from "@/lib/domain";
import type { ReliefWebEntity } from "./reliefweb-types";

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function excerpt(text: string, max = 320): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

function countryNames(entity: ReliefWebEntity): string[] {
  const raw = entity.fields?.country;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c) => c.name || c.value?.name)
    .filter((n): n is string => Boolean(n));
}

function mentionsIndia(entity: ReliefWebEntity): boolean {
  const blob = [
    entity.fields?.title,
    entity.fields?.body,
    entity.fields?.["body-html"],
    ...countryNames(entity),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return (
    blob.includes("india") ||
    blob.includes("indian") ||
    countryNames(entity).some((n) => n.toLowerCase().includes("india"))
  );
}

function inferCategory(entity: ReliefWebEntity): EventCategory {
  const text = [
    entity.fields?.title,
    entity.fields?.body,
    entity.fields?.["body-html"],
    entity.fields?.disaster?.name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const energy =
    /\b(oil|crude|petroleum|fuel|diesel|petrol|gas|lng|pipeline|refiner|opec|electricity|power grid|blackout)\b/i;
  const food =
    /\b(food|wheat|rice|crop|famine|hunger|agricultur|livestock|grain|humanitarian aid|wfp)\b/i;

  if (energy.test(text)) return "energy_fuel";
  if (food.test(text)) return "food_supply_chain";
  return "economic_policy";
}

function inferHorizon(entity: ReliefWebEntity): TimeHorizon {
  const d = entity.fields?.disaster?.name?.toLowerCase() ?? "";
  if (/\b(flood|cyclone|earthquake|tsunami|wildfire|outbreak)\b/.test(d))
    return "immediate";
  return "days";
}

function inferSeverity(entity: ReliefWebEntity): ImpactEvent["severity"] {
  const t = (entity.fields?.title ?? "").toLowerCase();
  if (/\b(urgent|emergency|catastrophic|massive)\b/.test(t)) return 4;
  return 3;
}

function personasForCategory(category: EventCategory): Persona[] {
  switch (category) {
    case "energy_fuel":
      return ["commuter", "small_business_owner", "importer", "student"];
    case "food_supply_chain":
      return ["farmer", "student", "small_business_owner", "importer"];
    default:
      return ["student", "small_business_owner", "commuter", "importer"];
  }
}

function publisher(entity: ReliefWebEntity): string {
  const src = entity.fields?.source?.[0]?.name;
  return src || "ReliefWeb / OCHA";
}

export function mapReliefWebEntityToImpactEvent(
  entity: ReliefWebEntity,
  retrievedAt = new Date().toISOString(),
): ImpactEvent | null {
  if (typeof entity.id !== "number") return null;
  const title = entity.fields?.title?.trim();
  const url = entity.fields?.url?.trim();
  if (!title || !url) return null;

  const htmlBody = entity.fields?.["body-html"];
  const plainBody = entity.fields?.body?.trim();
  const summarySource =
    plainBody || (htmlBody ? stripHtml(htmlBody) : "") || title;
  const summary = excerpt(summarySource, 400);

  const countries = countryNames(entity);
  const india = mentionsIndia(entity);
  const category = inferCategory(entity);
  const horizon = inferHorizon(entity);
  const severity = inferSeverity(entity);
  const pub = publisher(entity);

  const factsConfidence: ConfidenceLevel = "high";
  const inferConfidence: ConfidenceLevel = india ? "medium" : "low";

  const indiaImpact = india
    ? "This report explicitly references India or Indian territories in its metadata or text. Use the primary source for scope, timing, and official guidance."
    : "ReliefWeb covers global crises and humanitarian updates. India may be affected indirectly through trade, commodity prices, regional stability, or aid flows until Indian official sources confirm local impact.";

  const whatWeInfer = [
    india
      ? "If the situation escalates or spreads regionally, watch Indian ministry advisories, travel notices, and market commentary—but treat unsourced social posts as unreliable."
      : "Downstream effects for Indian households and businesses are uncertain without India-specific official confirmation.",
  ];

  const actionsAll: Partial<Record<Persona, string[]>> = {
    commuter: [
      "Read the linked ReliefWeb report and any cited primary sources before changing travel or spending plans.",
      "If the crisis is regional, check India’s official travel and safety advisories.",
    ],
    student: [
      "Use the original report for facts; avoid sharing screenshots without the source link.",
    ],
    small_business_owner: [
      "If you rely on imports or routes through the affected region, reconfirm lead times with logistics partners.",
    ],
    farmer: [
      "If the item concerns global food markets, verify crop procurement and MSP updates from Indian government channels only.",
    ],
    importer: [
      "Monitor customs and commerce ministry notices; do not assume border or tariff changes from headlines alone.",
    ],
  };

  return {
    slug: `rw-${entity.id}`,
    title,
    category,
    severity,
    horizon,
    updatedAt:
      entity.fields?.date?.original ??
      (entity.fields?.date?.changed
        ? new Date(entity.fields.date.changed * 1000).toISOString()
        : retrievedAt),
    whatWeKnow: [
      summary,
      countries.length > 0
        ? `Countries or territories referenced in metadata include: ${countries.slice(0, 8).join(", ")}${countries.length > 8 ? ", …" : ""}.`
        : "No structured country list was attached to this item; rely on the full report for geography.",
    ],
    whatWeInfer,
    indiaImpact,
    mostAffectedPersonas: personasForCategory(category),
    citations: [
      {
        id: `rw-${entity.id}`,
        title,
        url,
        publisher: pub,
        retrievedAt,
        kind: "multilateral",
      },
    ],
    factsConfidence,
    inferConfidence,
    actionsByPersona: actionsAll,
    provenance: "reliefweb",
    externalId: String(entity.id),
  };
}
