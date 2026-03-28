import { createHash } from "node:crypto";
import type {
  EventCategory,
  ConfidenceLevel,
  ImpactEvent,
  Persona,
  TimeHorizon,
} from "@/lib/domain";
import type { ApifyNewsItem } from "./apify-client";

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function excerpt(text: string, max = 320): string {
  const clean = stripHtml(text);
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trim()}...`;
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function firstString(
  item: ApifyNewsItem,
  keys: readonly string[],
): string | null {
  for (const key of keys) {
    const value = item[key];
    const direct = asString(value);
    if (direct) return direct;
    if (Array.isArray(value)) {
      for (const part of value) {
        const inner = asString(part);
        if (inner) return inner;
      }
    }
  }
  return null;
}

function sourceName(item: ApifyNewsItem): string {
  const source = item.source;
  if (typeof source === "string" && source.trim()) return source.trim();
  if (source && typeof source === "object" && !Array.isArray(source)) {
    const sourceRecord = source as Record<string, unknown>;
    const nested =
      asString(sourceRecord.name) ||
      asString(sourceRecord.title) ||
      asString(sourceRecord.publisher);
    if (nested) return nested;
  }
  return (
    firstString(item, ["publisher", "siteName", "domain", "author"]) ||
    "Apify news actor"
  );
}

function articleUrl(item: ApifyNewsItem): string | null {
  return firstString(item, [
    "url",
    "link",
    "articleUrl",
    "originUrl",
    "originalUrl",
  ]);
}

function bodyText(item: ApifyNewsItem): string {
  return [
    firstString(item, ["title", "headline", "name"]),
    firstString(item, ["description", "snippet", "summary", "text", "content"]),
    sourceName(item),
  ]
    .filter(Boolean)
    .join(" ");
}

function mentionsIndia(item: ApifyNewsItem): boolean {
  const blob = bodyText(item).toLowerCase();
  return blob.includes("india") || blob.includes("indian");
}

function inferCategory(item: ApifyNewsItem): EventCategory {
  const text = bodyText(item).toLowerCase();

  const energy =
    /\b(oil|crude|petroleum|fuel|diesel|petrol|gas|lng|shipping|freight|pipeline|refiner|opec|electricity|power grid|blackout)\b/i;
  const food =
    /\b(food|wheat|rice|crop|grain|agricultur|harvest|edible oil|supply chain|fertilizer|livestock)\b/i;

  if (energy.test(text)) return "energy_fuel";
  if (food.test(text)) return "food_supply_chain";
  return "economic_policy";
}

function inferHorizon(item: ApifyNewsItem): TimeHorizon {
  const text = bodyText(item).toLowerCase();
  if (/\b(breaking|storm|quake|flood|outage|disruption|shutdown)\b/.test(text)) {
    return "immediate";
  }
  if (/\b(policy|budget|rate|inflation|export|tariff|regulation)\b/.test(text)) {
    return "months";
  }
  return "days";
}

function inferSeverity(item: ApifyNewsItem): ImpactEvent["severity"] {
  const text = bodyText(item).toLowerCase();
  if (/\b(war|emergency|catastrophic|sanctions|major disruption)\b/.test(text)) {
    return 4;
  }
  if (/\b(outlook|analysis|preview|watch)\b/.test(text)) return 2;
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

function slugFor(url: string, title: string): string {
  return `ap-${createHash("sha1")
    .update(`${url}\n${title}`)
    .digest("hex")
    .slice(0, 12)}`;
}

function updatedAt(item: ApifyNewsItem, fallback: string): string {
  const raw = firstString(item, [
    "publishedAt",
    "pubDate",
    "published",
    "date",
    "timestamp",
  ]);
  if (!raw) return fallback;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toISOString();
}

export function mapApifyNewsItemToImpactEvent(
  item: ApifyNewsItem,
  retrievedAt = new Date().toISOString(),
): ImpactEvent | null {
  const title = firstString(item, ["title", "headline", "name"]);
  const url = articleUrl(item);
  if (!title || !url) return null;

  const category = inferCategory(item);
  const indiaMentioned = mentionsIndia(item);
  const summary =
    firstString(item, ["description", "snippet", "summary", "text", "content"]) ||
    title;
  const publisher = sourceName(item);
  const personas = personasForCategory(category);
  const factsConfidence: ConfidenceLevel = "medium";
  const inferConfidence: ConfidenceLevel = indiaMentioned ? "medium" : "low";

  const whatWeInfer = [
    indiaMentioned
      ? "Because this is a media report discovered via an Apify news actor, wait for official or primary-source confirmation before treating it as a settled policy or disruption in India."
      : "Possible India effects depend on whether the story changes trade flows, commodity prices, travel conditions, or domestic policy responses.",
  ];

  if (category === "energy_fuel") {
    whatWeInfer.push(
      "Energy or shipping headlines can show up first in freight and input costs, while household fuel effects often arrive later and are shaped by policy.",
    );
  }

  return {
    slug: slugFor(url, title),
    title,
    category,
    severity: inferSeverity(item),
    horizon: inferHorizon(item),
    updatedAt: updatedAt(item, retrievedAt),
    whatWeKnow: [
      excerpt(summary, 360),
      `Publisher: ${publisher}. Verify the original article and linked primary sources before relying on operational details.`,
    ],
    whatWeInfer,
    indiaImpact: indiaMentioned
      ? "This article appears directly India-related or India-relevant. Use it as an early signal, then confirm timing, geography, and official implications from Indian authorities or primary documents."
      : "This item was surfaced from a live news actor. India could be affected through fuel, food, financial, trade, or travel channels, but local impact remains uncertain without India-specific confirmation.",
    mostAffectedPersonas: personas,
    citations: [
      {
        id: slugFor(url, title),
        title,
        url,
        publisher,
        retrievedAt,
        kind: "media",
      },
    ],
    factsConfidence,
    inferConfidence,
    actionsByPersona: {
      commuter: [
        "Check for an official advisory before changing travel or fuel-buying behavior.",
      ],
      student: [
        "Use the original article link instead of reposted screenshots or summaries.",
      ],
      small_business_owner: [
        "If the story affects supply, imports, or credit, confirm practical exposure with suppliers and customers before repricing.",
      ],
      farmer: [
        "For food or fertilizer stories, verify any procurement or crop-policy angle from government sources.",
      ],
      importer: [
        "Treat the headline as a signal to review shipping, customs, and currency exposure, not as final guidance.",
      ],
    },
    provenance: "apify",
    externalId:
      firstString(item, ["id", "guid", "articleId"]) || url || title,
  };
}
