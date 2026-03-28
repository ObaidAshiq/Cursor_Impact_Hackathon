import type { ImpactEvent } from "@/lib/domain";
import {
  enrichEventWithGemini,
  isGeminiEnabled,
} from "@/lib/ai/gemini-enrich";
import {
  fetchApifyNewsItems,
  isApifyNewsConfigured,
} from "@/lib/sources/apify-client";
import {
  mapApifyNewsItemToSignal,
  mergeApifyNewsSignals,
} from "@/lib/sources/apify-news-signals";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import {
  buildImpactEventSourceHash,
  deleteStaleApifyEvents,
  getStoredImpactEventsBySlugs,
  upsertImpactEvents,
} from "@/lib/supabase/impact-events";

export type IngestImpactEventsResult = {
  fetchedItemCount: number;
  signalCount: number;
  storedEventCount: number;
  staleDeletedCount: number;
  geminiRefinedCount: number;
  geminiError?: string;
  jobRunId: string;
  fetchedAt: string;
};

function geminiIngestLimit(): number {
  const raw = process.env.GEMINI_INGEST_LIMIT?.trim();
  const parsed = raw ? Number(raw) : 0;
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
}

function shouldReuseStoredEvent(
  baselineEvent: ImpactEvent,
  storedEvent: ImpactEvent | undefined,
): boolean {
  if (!storedEvent) return false;
  return buildImpactEventSourceHash(baselineEvent) === buildImpactEventSourceHash(storedEvent);
}

async function maybeEnrichEventsOnIngest(
  events: readonly ImpactEvent[],
  storedBySlug: Map<string, ImpactEvent>,
): Promise<{
  events: ImpactEvent[];
  geminiRefinedCount: number;
  geminiError?: string;
}> {
  const limit = geminiIngestLimit();
  if (!isGeminiEnabled() || limit <= 0) {
    return { events: [...events], geminiRefinedCount: 0 };
  }

  const nextEvents: ImpactEvent[] = [];
  let geminiRefinedCount = 0;
  let geminiError: string | undefined;

  for (const event of events) {
    const stored = storedBySlug.get(event.slug);
    if (shouldReuseStoredEvent(event, stored)) {
      nextEvents.push(stored!);
      continue;
    }

    if (geminiRefinedCount >= limit) {
      nextEvents.push(event);
      continue;
    }

    const enriched = await enrichEventWithGemini(event);
    if (enriched.narrativeRefinedWithGemini) {
      geminiRefinedCount += 1;
    }
    if (!geminiError && enriched.aiError) {
      geminiError = enriched.aiError;
    }
    nextEvents.push(enriched);
  }

  return { events: nextEvents, geminiRefinedCount, geminiError };
}

export async function ingestImpactEvents(): Promise<IngestImpactEventsResult> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured for impact event ingestion.");
  }
  if (!isApifyNewsConfigured()) {
    throw new Error("Apify is not configured for impact event ingestion.");
  }

  const fetchedAt = new Date().toISOString();
  const jobRunId = `apify-${fetchedAt}`;
  const items = await fetchApifyNewsItems();
  const signals = items
    .map((item) => mapApifyNewsItemToSignal(item, fetchedAt))
    .filter((signal): signal is NonNullable<typeof signal> => Boolean(signal));
  const mergedEvents = mergeApifyNewsSignals(signals);
  const storedBySlug = await getStoredImpactEventsBySlugs(
    mergedEvents.map((event) => event.slug),
  );
  const { events, geminiRefinedCount, geminiError } =
    await maybeEnrichEventsOnIngest(mergedEvents, storedBySlug);

  await upsertImpactEvents(events, { jobRunId });
  const staleDeletedCount = await deleteStaleApifyEvents(events.map((event) => event.slug));

  return {
    fetchedItemCount: items.length,
    signalCount: signals.length,
    storedEventCount: events.length,
    staleDeletedCount,
    geminiRefinedCount,
    geminiError,
    jobRunId,
    fetchedAt,
  };
}
