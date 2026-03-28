import { createHash } from "node:crypto";
import type {
  Citation,
  ConfidenceLevel,
  EventCategory,
  ImpactEvent,
  Persona,
  TimeHorizon,
} from "@/lib/domain";
import type { ApifyNewsItem } from "./apify-client";

export type ApifyNewsSignal = {
  id: string;
  externalId: string;
  url: string;
  title: string;
  summary: string;
  publisher: string;
  updatedAt: string;
  retrievedAt: string;
  category: EventCategory;
  severity: ImpactEvent["severity"];
  horizon: TimeHorizon;
  indiaMentioned: boolean;
  mostAffectedPersonas: Persona[];
  topics: string[];
  tokens: string[];
  clusterKey: string;
  bodyText: string;
  citation: Citation;
};

const stopwords = new Set([
  "a",
  "about",
  "after",
  "ahead",
  "amid",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "how",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "our",
  "out",
  "says",
  "show",
  "shows",
  "signal",
  "signals",
  "story",
  "the",
  "their",
  "this",
  "to",
  "under",
  "update",
  "what",
  "with",
  "world",
]);

const topicPatterns: Array<{ label: string; pattern: RegExp }> = [
  { label: "shipping", pattern: /\b(shipping|freight|route|port|tanker|cargo)\b/i },
  { label: "oil", pattern: /\b(oil|crude|petroleum|opec|refiner)\b/i },
  { label: "fuel", pattern: /\b(fuel|diesel|petrol|gas|lng)\b/i },
  { label: "power", pattern: /\b(power|electricity|grid|blackout|outage)\b/i },
  { label: "wheat", pattern: /\b(wheat|atta)\b/i },
  { label: "rice", pattern: /\b(rice|grain|crop|harvest)\b/i },
  { label: "fertilizer", pattern: /\b(fertilizer|fertiliser)\b/i },
  { label: "food", pattern: /\b(food|edible oil|livestock|supply chain)\b/i },
  { label: "rates", pattern: /\b(rate|rates|loan|credit|borrowing|emi)\b/i },
  { label: "inflation", pattern: /\b(inflation|price rise|consumer prices)\b/i },
  { label: "trade", pattern: /\b(export|import|tariff|customs|trade)\b/i },
  { label: "policy", pattern: /\b(policy|budget|regulation|government|rbi)\b/i },
];

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
    firstString(item, [
      "publisher",
      "Publisher",
      "siteName",
      "SiteName",
      "domain",
      "Domain",
      "author",
      "Author",
      "Authors",
    ]) ||
    "Apify news actor"
  );
}

function articleUrl(item: ApifyNewsItem): string | null {
  return firstString(item, [
    "url",
    "URL",
    "link",
    "Link",
    "articleUrl",
    "ArticleUrl",
    "Article URL",
    "originUrl",
    "originalUrl",
    "OriginalUrl",
  ]);
}

function titleFromItem(item: ApifyNewsItem): string | null {
  return firstString(item, [
    "title",
    "Title",
    "headline",
    "Headline",
    "name",
    "Name",
  ]);
}

function summaryFromItem(item: ApifyNewsItem, fallback: string): string {
  return (
    firstString(item, [
      "description",
      "Description",
      "snippet",
      "Snippet",
      "summary",
      "Summary",
      "text",
      "Text",
      "content",
      "Content",
    ]) || fallback
  );
}

function bodyText(item: ApifyNewsItem): string {
  return [titleFromItem(item), summaryFromItem(item, ""), sourceName(item)]
    .filter(Boolean)
    .join(" ");
}

function mentionsIndia(text: string): boolean {
  const blob = text.toLowerCase();
  return blob.includes("india") || blob.includes("indian");
}

function inferCategory(text: string): EventCategory {
  const energy =
    /\b(oil|crude|petroleum|fuel|diesel|petrol|gas|lng|shipping|freight|pipeline|refiner|opec|electricity|power grid|blackout)\b/i;
  const food =
    /\b(food|wheat|rice|crop|grain|agricultur|harvest|edible oil|supply chain|fertilizer|livestock)\b/i;

  if (energy.test(text)) return "energy_fuel";
  if (food.test(text)) return "food_supply_chain";
  return "economic_policy";
}

function inferHorizon(text: string): TimeHorizon {
  if (/\b(breaking|storm|quake|flood|outage|disruption|shutdown)\b/i.test(text)) {
    return "immediate";
  }
  if (/\b(policy|budget|rate|inflation|export|tariff|regulation)\b/i.test(text)) {
    return "months";
  }
  return "days";
}

function inferSeverity(text: string): ImpactEvent["severity"] {
  if (/\b(war|emergency|catastrophic|sanctions|major disruption)\b/i.test(text)) {
    return 4;
  }
  if (/\b(outlook|analysis|preview|watch)\b/i.test(text)) return 2;
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

function updatedAt(item: ApifyNewsItem, fallback: string): string {
  const raw = firstString(item, [
    "publishedAt",
    "PublishedAt",
    "pubDate",
    "PubDate",
    "published",
    "Published",
    "date",
    "Date",
    "timestamp",
    "Timestamp",
    "modified",
    "Modified",
  ]);
  if (!raw) return fallback;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toISOString();
}

function normalizeTokens(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((token) => token.length > 2 && !stopwords.has(token)),
    ),
  );
}

function extractTopics(text: string, category: EventCategory): string[] {
  const matches = topicPatterns
    .filter((entry) => entry.pattern.test(text))
    .map((entry) => entry.label);
  if (matches.length > 0) return Array.from(new Set(matches)).slice(0, 4);

  const tokens = normalizeTokens(text);
  return [
    category,
    ...tokens.filter((token) => token !== category.replace("_", "")).slice(0, 3),
  ].slice(0, 4);
}

function clusterKeyFor(
  category: EventCategory,
  topics: readonly string[],
  title: string,
): string {
  const basis = topics.length > 0 ? topics.slice(0, 3) : normalizeTokens(title).slice(0, 3);
  return `${category}:${basis.join("-")}`;
}

function overlapCount(left: readonly string[], right: readonly string[]): number {
  const rightSet = new Set(right);
  return left.filter((value) => rightSet.has(value)).length;
}

function areSignalsRelated(
  left: ApifyNewsSignal,
  right: ApifyNewsSignal,
): boolean {
  if (left.category !== right.category) return false;
  if (left.url === right.url) return true;

  const topicOverlap = overlapCount(left.topics, right.topics);
  const tokenOverlap = overlapCount(left.tokens, right.tokens);

  if (left.clusterKey === right.clusterKey) return true;
  if (topicOverlap >= 2) return true;
  if (topicOverlap >= 1 && tokenOverlap >= 3) return true;
  if (tokenOverlap >= 4) return true;
  return false;
}

function slugFor(value: string): string {
  return `ap-${createHash("sha1").update(value).digest("hex").slice(0, 12)}`;
}

function publishersText(signals: readonly ApifyNewsSignal[]): string {
  const publishers = Array.from(new Set(signals.map((signal) => signal.publisher))).slice(0, 3);
  if (publishers.length === 0) return "recent media reports";
  if (publishers.length === 1) return publishers[0]!;
  if (publishers.length === 2) return `${publishers[0]} and ${publishers[1]}`;
  return `${publishers[0]}, ${publishers[1]}, and ${publishers[2]}`;
}

function earliestHorizon(signals: readonly ApifyNewsSignal[]): TimeHorizon {
  const rank: Record<TimeHorizon, number> = {
    immediate: 0,
    days: 1,
    weeks: 2,
    months: 3,
  };
  return [...signals]
    .sort((left, right) => rank[left.horizon] - rank[right.horizon])[0]!.horizon;
}

function factsConfidenceFor(signals: readonly ApifyNewsSignal[]): ConfidenceLevel {
  const publishers = new Set(signals.map((signal) => signal.publisher)).size;
  if (publishers >= 3) return "high";
  if (publishers >= 2) return "medium";
  return "low";
}

function inferConfidenceFor(
  signals: readonly ApifyNewsSignal[],
  indiaMentioned: boolean,
): ConfidenceLevel {
  if (indiaMentioned && signals.length >= 2) return "medium";
  if (indiaMentioned) return "medium";
  return signals.length >= 3 ? "medium" : "low";
}

function topTopicsForCluster(signals: readonly ApifyNewsSignal[]): string[] {
  const counts = new Map<string, number>();
  for (const signal of signals) {
    for (const topic of signal.topics) {
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((left, right) => {
      const countDelta = right[1] - left[1];
      if (countDelta !== 0) return countDelta;
      return left[0].localeCompare(right[0]);
    })
    .map(([topic]) => topic)
    .slice(0, 3);
}

function buildTopicPhrase(topics: readonly string[]): string {
  const preferred = topics.filter(
    (topic) => !["policy", "trade", "food"].includes(topic),
  );
  const chosen = (preferred.length > 0 ? preferred : topics).slice(0, 2);
  if (chosen.length === 0) return "market";
  if (chosen.length === 1) return chosen[0]!;
  return `${chosen[0]} and ${chosen[1]}`;
}

function titleForCluster(signals: readonly ApifyNewsSignal[]): string {
  const lead = signals[0]!;
  const topics = topTopicsForCluster(signals);
  const topicPhrase = buildTopicPhrase(topics);

  switch (lead.category) {
    case "energy_fuel":
      if (topics.includes("shipping") && (topics.includes("oil") || topics.includes("fuel"))) {
        return "Shipping and oil signals may raise fuel and freight costs";
      }
      if (topics.includes("power")) {
        return "Power and fuel signals may disrupt transport and operating costs";
      }
      return `${capitalize(topicPhrase)} signals may pressure fuel and transport costs`;
    case "food_supply_chain":
      if (topics.includes("wheat") || topics.includes("rice")) {
        return "Staple and farm-input signals may pressure food budgets";
      }
      if (topics.includes("fertilizer")) {
        return "Fertilizer and crop signals may pressure farm and food costs";
      }
      return `${capitalize(topicPhrase)} signals may affect food supply and household budgets`;
    case "economic_policy":
      if (topics.includes("rates") || topics.includes("inflation")) {
        return "Rate and inflation signals may affect credit and business costs";
      }
      return `${capitalize(topicPhrase)} signals may affect pricing and business planning`;
  }
}

function capitalize(value: string): string {
  if (!value) return value;
  return `${value[0]!.toUpperCase()}${value.slice(1)}`;
}

function clusterKeyFromSignals(signals: readonly ApifyNewsSignal[]): string {
  const lead = signals[0]!;
  const topics = topTopicsForCluster(signals);
  const basis = topics.length > 0 ? topics : lead.tokens.slice(0, 3);
  return `${lead.category}:${basis.join("-")}`;
}

function whatWeInferFor(
  category: EventCategory,
  indiaMentioned: boolean,
): string[] {
  const lines = [
    indiaMentioned
      ? "Multiple live reports point to a development that may already have an India-relevant angle, but official confirmation is still important before treating it as settled."
      : "This cluster is best treated as an early signal. India effects depend on whether the development changes prices, trade flows, transport conditions, or domestic policy.",
  ];

  switch (category) {
    case "energy_fuel":
      lines.push(
        "Energy and shipping shocks often appear first through freight, pump-price pressure, and delivery costs rather than an immediate nationwide shortage.",
      );
      break;
    case "food_supply_chain":
      lines.push(
        "Food and crop signals often reach households through wholesale markets, retail staples, and farm-input costs on different timelines.",
      );
      break;
    case "economic_policy":
      lines.push(
        "Policy or macro signals usually pass through banks, trade channels, and business pricing gradually rather than all at once.",
      );
      break;
  }

  return lines;
}

function indiaImpactFor(
  category: EventCategory,
  indiaMentioned: boolean,
): string {
  if (indiaMentioned) {
    return "At least one source in this cluster directly mentions India or an India-relevant implication. Use it as an early-warning signal, then confirm timing, geography, and official consequences from primary sources.";
  }

  switch (category) {
    case "energy_fuel":
      return "India could feel this through imported energy costs, freight charges, and downstream transport pricing if the signal persists.";
    case "food_supply_chain":
      return "India could feel this through staple prices, input costs, and procurement or trade responses if the signal broadens.";
    case "economic_policy":
      return "India could feel this through credit conditions, trade terms, and business planning if the signal turns into a sustained policy or market shift.";
  }
}

function actionsForCategory(
  category: EventCategory,
): Partial<Record<Persona, string[]>> {
  switch (category) {
    case "energy_fuel":
      return {
        commuter: [
          "Watch official advisories and local fuel conditions before changing travel or buying behavior.",
        ],
        student: [
          "Treat headlines as an early warning and verify transport or budget effects through primary sources.",
        ],
        small_business_owner: [
          "Check supplier, freight, and delivery exposure before repricing or promising new timelines.",
        ],
        importer: [
          "Review shipping, customs, and currency exposure before treating the signal as an operational change.",
        ],
      };
    case "food_supply_chain":
      return {
        farmer: [
          "Verify procurement, mandi, and ministry notices before changing input or selling plans.",
        ],
        student: [
          "Budget for gradual staple-price movement rather than reacting to one headline alone.",
        ],
        small_business_owner: [
          "Confirm wholesale input changes before altering menus, inventory, or customer prices.",
        ],
        importer: [
          "Monitor trade notices and supplier updates before assuming a lasting supply disruption.",
        ],
      };
    default:
      return {
        commuter: [
          "Use official announcements and lender terms, not headlines alone, before making finance decisions.",
        ],
        student: [
          "Treat macro or policy coverage as context and verify the actual effect on loan or budget decisions.",
        ],
        small_business_owner: [
          "Review working-capital, trade, and pricing exposure only after checking confirmed policy details.",
        ],
        importer: [
          "Re-check duties, FX exposure, and compliance steps before changing trade operations.",
        ],
      };
  }
}

export function mapApifyNewsItemToSignal(
  item: ApifyNewsItem,
  retrievedAt = new Date().toISOString(),
): ApifyNewsSignal | null {
  const title = titleFromItem(item);
  const url = articleUrl(item);
  if (!title || !url) return null;

  const summary = excerpt(summaryFromItem(item, title), 360);
  const publisher = sourceName(item);
  const combinedText = `${title} ${summary} ${publisher}`;
  const category = inferCategory(combinedText);
  const topics = extractTopics(combinedText, category);
  const clusterKey = clusterKeyFor(category, topics, title);
  const externalId =
    firstString(item, ["id", "Id", "guid", "Guid", "articleId", "ArticleId"]) ||
    url ||
    title;
  const updated = updatedAt(item, retrievedAt);
  const id = slugFor(`${externalId}\n${url}\n${title}`);
  const tokens = normalizeTokens(`${title} ${summary}`).slice(0, 8);

  return {
    id,
    externalId,
    url,
    title,
    summary,
    publisher,
    updatedAt: updated,
    retrievedAt,
    category,
    severity: inferSeverity(combinedText),
    horizon: inferHorizon(combinedText),
    indiaMentioned: mentionsIndia(combinedText),
    mostAffectedPersonas: personasForCategory(category),
    topics,
    tokens,
    clusterKey,
    bodyText: combinedText,
    citation: {
      id,
      title,
      url,
      publisher,
      retrievedAt,
      kind: "media",
    },
  };
}

export function mergeApifyNewsSignals(
  signals: readonly ApifyNewsSignal[],
): ImpactEvent[] {
  const ordered = [...signals].sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
  const grouped: ApifyNewsSignal[][] = [];

  for (const signal of ordered) {
    const existingGroup = grouped.find((group) =>
      group.some((candidate) => areSignalsRelated(signal, candidate)),
    );
    if (existingGroup) {
      existingGroup.push(signal);
      continue;
    }
    grouped.push([signal]);
  }

  return grouped
    .map((group) => {
      const signalsForCluster = [...group].sort((left, right) => {
        const timeDelta =
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
        if (timeDelta !== 0) return timeDelta;
        return left.title.localeCompare(right.title);
      });
      const lead = signalsForCluster[0]!;
      const indiaMentioned = signalsForCluster.some((signal) => signal.indiaMentioned);
      const allPersonas = Array.from(
        new Set(signalsForCluster.flatMap((signal) => signal.mostAffectedPersonas)),
      ) as Persona[];
      const citations = Array.from(
        new Map(
          signalsForCluster
            .map((signal) => signal.citation)
            .map((citation) => [citation.url, citation] as const),
        ).values(),
      ).slice(0, 5);
      const sourceCount = signalsForCluster.length;
      const publishers = publishersText(signalsForCluster);
      const factsConfidence = factsConfidenceFor(signalsForCluster);
      const inferConfidence = inferConfidenceFor(signalsForCluster, indiaMentioned);
      const clusterKey = clusterKeyFromSignals(signalsForCluster);

      return {
        slug: slugFor(clusterKey),
        title: titleForCluster(signalsForCluster),
        category: lead.category,
        severity: Math.max(...signalsForCluster.map((signal) => signal.severity)) as ImpactEvent["severity"],
        horizon: earliestHorizon(signalsForCluster),
        updatedAt: lead.updatedAt,
        whatWeKnow: [
          lead.summary,
          sourceCount > 1
            ? `This signal groups ${sourceCount} recent reports from ${publishers}. Confirm the common details in the linked source articles before acting.`
            : `Publisher: ${lead.publisher}. Verify the original article and linked primary sources before relying on operational details.`,
        ],
        whatWeInfer: whatWeInferFor(lead.category, indiaMentioned),
        indiaImpact: indiaImpactFor(lead.category, indiaMentioned),
        mostAffectedPersonas: allPersonas,
        citations,
        factsConfidence,
        inferConfidence,
        actionsByPersona: actionsForCategory(lead.category),
        provenance: "apify",
        externalId: clusterKey,
      } satisfies ImpactEvent;
    })
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    );
}
