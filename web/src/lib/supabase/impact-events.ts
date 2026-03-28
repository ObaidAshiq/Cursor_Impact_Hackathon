import { createHash } from "crypto";
import type {
  AiRefinedFields,
  Citation,
  CitationKind,
  ConfidenceLevel,
  EventCategory,
  EventProvenance,
  ImpactEvent,
  Persona,
  TimeHorizon,
} from "@/lib/domain";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const IMPACT_EVENTS_TABLE = "impact_events";

type StoredImpactEventRow = {
  slug: string;
  event: unknown;
  category: string;
  updated_at: string;
  provenance: string;
  source_hash: string;
  ingested_at?: string;
  job_run_id?: string | null;
};

type UpsertImpactEventsOptions = {
  jobRunId?: string;
};

type StoredImpactEventMetadata = Pick<
  StoredImpactEventRow,
  "slug" | "source_hash" | "updated_at" | "provenance"
>;

const EVENT_CATEGORIES = new Set<EventCategory>([
  "energy_fuel",
  "food_supply_chain",
  "economic_policy",
]);

const CONFIDENCE_LEVELS = new Set<ConfidenceLevel>([
  "high",
  "medium",
  "low",
  "insufficient",
]);

const PERSONAS = new Set<Persona>([
  "commuter",
  "student",
  "small_business_owner",
  "farmer",
  "importer",
]);

const TIME_HORIZONS = new Set<TimeHorizon>([
  "immediate",
  "days",
  "weeks",
  "months",
]);

const CITATION_KINDS = new Set<CitationKind>([
  "official",
  "multilateral",
  "media",
  "data",
]);

const EVENT_PROVENANCE = new Set<EventProvenance>([
  "curated",
  "apify",
  "reliefweb",
  "eia",
]);

const AI_REFINED_FIELDS = new Set<keyof AiRefinedFields>([
  "whatWeKnow",
  "whatWeInfer",
  "indiaImpact",
  "localNotes",
  "actionsByPersona",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isPersonaArray(value: unknown): value is Persona[] {
  return Array.isArray(value) && value.every((item) => PERSONAS.has(item as Persona));
}

function isCitation(value: unknown): value is Citation {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.url === "string" &&
    typeof value.publisher === "string" &&
    typeof value.retrievedAt === "string" &&
    CITATION_KINDS.has(value.kind as CitationKind)
  );
}

function isActionsByPersona(
  value: unknown,
): value is Partial<Record<Persona, string[]>> {
  if (!isRecord(value)) return false;
  return Object.entries(value).every(
    ([key, lines]) => PERSONAS.has(key as Persona) && isStringArray(lines),
  );
}

function isLocalNotes(value: unknown): value is Record<string, string> {
  if (!isRecord(value)) return false;
  return Object.values(value).every((entry) => typeof entry === "string");
}

function isAiRefinedFields(value: unknown): value is AiRefinedFields {
  if (!isRecord(value)) return false;
  return Object.entries(value).every(
    ([key, entry]) =>
      AI_REFINED_FIELDS.has(key as keyof AiRefinedFields) && entry === true,
  );
}

export function isImpactEvent(value: unknown): value is ImpactEvent {
  if (!isRecord(value)) return false;

  return (
    typeof value.slug === "string" &&
    typeof value.title === "string" &&
    EVENT_CATEGORIES.has(value.category as EventCategory) &&
    [1, 2, 3, 4, 5].includes(value.severity as number) &&
    TIME_HORIZONS.has(value.horizon as TimeHorizon) &&
    typeof value.updatedAt === "string" &&
    isStringArray(value.whatWeKnow) &&
    isStringArray(value.whatWeInfer) &&
    typeof value.indiaImpact === "string" &&
    (value.localNotes === undefined || isLocalNotes(value.localNotes)) &&
    isPersonaArray(value.mostAffectedPersonas) &&
    Array.isArray(value.citations) &&
    value.citations.every((entry) => isCitation(entry)) &&
    CONFIDENCE_LEVELS.has(value.factsConfidence as ConfidenceLevel) &&
    CONFIDENCE_LEVELS.has(value.inferConfidence as ConfidenceLevel) &&
    isActionsByPersona(value.actionsByPersona) &&
    (value.provenance === undefined ||
      EVENT_PROVENANCE.has(value.provenance as EventProvenance)) &&
    (value.externalId === undefined || typeof value.externalId === "string") &&
    (value.narrativeRefinedWithGemini === undefined ||
      typeof value.narrativeRefinedWithGemini === "boolean") &&
    (value.aiRefinedFields === undefined || isAiRefinedFields(value.aiRefinedFields)) &&
    (value.aiError === undefined || typeof value.aiError === "string") &&
    (value.aiModel === undefined || typeof value.aiModel === "string")
  );
}

function stableJsonStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableJsonStringify(entry)).join(",")}]`;
  }
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJsonStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function buildImpactEventSourceHash(event: ImpactEvent): string {
  const baselineEvent = {
    ...event,
    narrativeRefinedWithGemini: undefined,
    aiRefinedFields: undefined,
    aiError: undefined,
    aiModel: undefined,
  };
  return createHash("sha256").update(stableJsonStringify(baselineEvent)).digest("hex");
}

function normalizeProvenance(event: ImpactEvent): string {
  return event.provenance ?? "curated";
}

function toStoredImpactEventRow(
  event: ImpactEvent,
  options: UpsertImpactEventsOptions = {},
): StoredImpactEventRow {
  if (!isImpactEvent(event)) {
    throw new Error(`Invalid ImpactEvent payload for slug "${(event as Record<string, unknown>)?.slug ?? "unknown"}".`);
  }

  return {
    slug: event.slug,
    event,
    category: event.category,
    updated_at: event.updatedAt,
    provenance: normalizeProvenance(event),
    source_hash: buildImpactEventSourceHash(event),
    job_run_id: options.jobRunId ?? null,
  };
}

function fromStoredImpactEventRow(row: StoredImpactEventRow): ImpactEvent {
  if (!isImpactEvent(row.event)) {
    throw new Error(`Stored row "${row.slug}" does not contain a valid ImpactEvent payload.`);
  }
  return row.event;
}

export async function upsertImpactEvents(
  events: readonly ImpactEvent[],
  options: UpsertImpactEventsOptions = {},
): Promise<void> {
  if (events.length === 0) return;
  const admin = getSupabaseAdmin();
  const rows = events.map((event) => toStoredImpactEventRow(event, options));
  const { error } = await admin
    .from(IMPACT_EVENTS_TABLE)
    .upsert(rows, { onConflict: "slug" });

  if (error) {
    throw new Error(`Failed to upsert impact events: ${error.message}`);
  }
}

export async function listStoredImpactEvents(
  options: { category?: EventCategory; provenance?: EventProvenance; limit?: number } = {},
): Promise<ImpactEvent[]> {
  const admin = getSupabaseAdmin();
  let query = admin
    .from(IMPACT_EVENTS_TABLE)
    .select("slug, event, category, updated_at, provenance, source_hash, ingested_at, job_run_id")
    .order("updated_at", { ascending: false });

  if (options.category) query = query.eq("category", options.category);
  if (options.provenance) query = query.eq("provenance", options.provenance);
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to list stored impact events: ${error.message}`);
  }

  return ((data ?? []) as StoredImpactEventRow[]).map((row) => fromStoredImpactEventRow(row));
}

export async function getStoredImpactEventBySlug(
  slug: string,
): Promise<ImpactEvent | undefined> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from(IMPACT_EVENTS_TABLE)
    .select("slug, event, category, updated_at, provenance, source_hash, ingested_at, job_run_id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get stored impact event "${slug}": ${error.message}`);
  }
  if (!data) return undefined;

  return fromStoredImpactEventRow(data as StoredImpactEventRow);
}

export async function getStoredImpactEventMetadataBySlugs(
  slugs: readonly string[],
): Promise<Map<string, StoredImpactEventMetadata>> {
  if (slugs.length === 0) return new Map();
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from(IMPACT_EVENTS_TABLE)
    .select("slug, source_hash, updated_at, provenance")
    .in("slug", [...slugs]);

  if (error) {
    throw new Error(`Failed to load stored impact event metadata: ${error.message}`);
  }

  return new Map(
    ((data ?? []) as StoredImpactEventMetadata[]).map((row) => [row.slug, row]),
  );
}

export async function getStoredImpactEventsBySlugs(
  slugs: readonly string[],
): Promise<Map<string, ImpactEvent>> {
  if (slugs.length === 0) return new Map();
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from(IMPACT_EVENTS_TABLE)
    .select("slug, event, category, updated_at, provenance, source_hash, ingested_at, job_run_id")
    .in("slug", [...slugs]);

  if (error) {
    throw new Error(`Failed to load stored impact events by slug: ${error.message}`);
  }

  return new Map(
    ((data ?? []) as StoredImpactEventRow[]).map((row) => [
      row.slug,
      fromStoredImpactEventRow(row),
    ]),
  );
}

export async function deleteStaleApifyEvents(
  activeSlugs: readonly string[],
): Promise<number> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from(IMPACT_EVENTS_TABLE)
    .select("slug")
    .eq("provenance", "apify");

  if (error) {
    throw new Error(`Failed to load existing Apify event slugs: ${error.message}`);
  }

  const staleSlugs = (data ?? [])
    .map((row) => row.slug)
    .filter((slug): slug is string => typeof slug === "string")
    .filter((slug) => !activeSlugs.includes(slug));

  if (staleSlugs.length === 0) return 0;

  const { error: deleteError } = await admin
    .from(IMPACT_EVENTS_TABLE)
    .delete()
    .in("slug", staleSlugs);

  if (deleteError) {
    throw new Error(`Failed to delete stale Apify events: ${deleteError.message}`);
  }

  return staleSlugs.length;
}
