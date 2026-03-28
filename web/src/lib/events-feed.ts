import { seedEvents } from "@/data/seed-events";
import type { ImpactEvent } from "@/lib/domain";
import {
  getEventBySlug,
  type EventListFilters,
  listEvents,
  localBlurbForRegion,
} from "@/lib/events";
import { fetchReliefWebReportById } from "@/lib/sources/reliefweb-client";
import { fetchEiaBrentSpotDaily, isEiaConfigured } from "@/lib/sources/eia-client";
import {
  fetchApifyNewsItems,
  isApifyNewsConfigured,
} from "@/lib/sources/apify-client";
import {
  getNewsArticleFromDbBySlug,
  isSupabaseNewsFeedEnabled,
  listNewsArticlesFromDb,
} from "@/lib/news-repository";
import {
  buildEiaPetroleumSnapshotEvent,
  EIA_PETROLEUM_SNAPSHOT_SLUG,
} from "@/lib/sources/map-eia-snapshot-event";
import { mapApifyNewsItemToImpactEvent } from "@/lib/sources/map-apify-news-to-event";
import { mapReliefWebEntityToImpactEvent } from "@/lib/sources/map-reliefweb-to-event";
import {
  enrichEventWithGemini,
  isGeminiEnabled,
} from "@/lib/ai/gemini-enrich";

function geminiFeedLimit(): number {
  const raw = process.env.GEMINI_FEED_LIMIT?.trim();
  const parsed = raw ? Number(raw) : 2;
  if (!Number.isFinite(parsed) || parsed < 0) return 2;
  return Math.floor(parsed);
}

async function enrichFeedEvents(
  events: ImpactEvent[],
): Promise<{ events: ImpactEvent[]; geminiError?: string }> {
  if (!isGeminiEnabled()) return { events };
  const limit = Math.min(geminiFeedLimit(), events.length);
  if (limit <= 0) return { events };

  const batch = 2;
  const enriched = [...events];
  let geminiError: string | undefined;

  for (let i = 0; i < limit; i += batch) {
    const end = Math.min(i + batch, limit);
    const chunk = await Promise.all(
      enriched.slice(i, end).map((event) => enrichEventWithGemini(event)),
    );
    for (let j = 0; j < chunk.length; j += 1) {
      enriched[i + j] = chunk[j];
      if (!geminiError && chunk[j].aiError) {
        geminiError = chunk[j].aiError;
      }
    }
  }

  return { events: enriched, geminiError };
}

function apifyFeedDisplayLimit(): number {
  const raw = process.env.APIFY_NEWS_LIMIT?.trim();
  const parsed = raw ? Number(raw) : 12;
  if (!Number.isFinite(parsed)) return 12;
  return Math.min(100, Math.max(1, Math.floor(parsed)));
}

export type FeedResult = {
  events: ImpactEvent[];
  apifyError?: string;
  liveFetchedAt?: string;
  eiaError?: string;
  geminiError?: string;
};

export async function listEventsForFeed(
  filters: EventListFilters = {},
): Promise<FeedResult> {
  const fetchedAt = new Date().toISOString();
  let apifyNews: ImpactEvent[] = [];
  let apifyError: string | undefined;
  let liveFetchedAt: string | undefined;
  let eiaError: string | undefined;
  let eiaEvent: ImpactEvent | null = null;

  if (isSupabaseNewsFeedEnabled()) {
    try {
      const { events: fromDb, lastSyncAt } = await listNewsArticlesFromDb(
        apifyFeedDisplayLimit(),
      );
      apifyNews = fromDb;
      liveFetchedAt = lastSyncAt ?? undefined;
    } catch (err) {
      apifyError =
        err instanceof Error
          ? err.message
          : "Supabase news feed could not be loaded.";
    }
  } else if (isApifyNewsConfigured()) {
    try {
      const items = await fetchApifyNewsItems();
      apifyNews = items
        .map((item) => mapApifyNewsItemToImpactEvent(item, fetchedAt))
        .filter((e): e is ImpactEvent => Boolean(e));
      liveFetchedAt = fetchedAt;
    } catch (err) {
      apifyError =
        err instanceof Error ? err.message : "Apify news feed could not be loaded.";
    }
  }

  if (
    process.env.DISABLE_EIA_FEED !== "1" &&
    isEiaConfigured()
  ) {
    try {
      const rows = await fetchEiaBrentSpotDaily(5);
      eiaEvent = buildEiaPetroleumSnapshotEvent(rows, fetchedAt);
    } catch (err) {
      eiaError =
        err instanceof Error ? err.message : "EIA petroleum snapshot failed.";
    }
  }

  const merged = [
    ...(eiaEvent ? [eiaEvent] : []),
    ...apifyNews,
    ...seedEvents,
  ];
  const listed = listEvents(filters, merged);
  const { events, geminiError } = await enrichFeedEvents(listed);
  return {
    events,
    apifyError,
    liveFetchedAt,
    eiaError,
    geminiError,
  };
}

export async function getEventBySlugResolved(
  slug: string,
): Promise<ImpactEvent | undefined> {
  if (slug === EIA_PETROLEUM_SNAPSHOT_SLUG) {
    if (!isEiaConfigured()) return undefined;
    try {
      const rows = await fetchEiaBrentSpotDaily(5);
      const ev =
        buildEiaPetroleumSnapshotEvent(
          rows,
          new Date().toISOString(),
        ) ?? undefined;
      return ev ? enrichEventWithGemini(ev) : undefined;
    } catch {
      return undefined;
    }
  }
  if (slug.startsWith("ap-")) {
    if (isSupabaseNewsFeedEnabled()) {
      try {
        const ev = await getNewsArticleFromDbBySlug(slug);
        return ev ? enrichEventWithGemini(ev) : undefined;
      } catch {
        return undefined;
      }
    }
    if (!isApifyNewsConfigured()) return undefined;
    try {
      const items = await fetchApifyNewsItems(25);
      const ev =
        items
          .map((item) => mapApifyNewsItemToImpactEvent(item, new Date().toISOString()))
          .find((item): item is ImpactEvent => item?.slug === slug) ?? undefined;
      return ev ? enrichEventWithGemini(ev) : undefined;
    } catch {
      return undefined;
    }
  }
  if (slug.startsWith("rw-")) {
    const raw = slug.slice(3);
    const id = Number(raw);
    if (!Number.isFinite(id)) return undefined;
    const entity = await fetchReliefWebReportById(id);
    if (!entity) return undefined;
    const ev =
      mapReliefWebEntityToImpactEvent(entity, new Date().toISOString()) ??
      undefined;
    return ev ? enrichEventWithGemini(ev) : undefined;
  }
  const curated = getEventBySlug(slug);
  return curated ? enrichEventWithGemini(curated) : undefined;
}

export function getStaticEventSlugs(): string[] {
  return seedEvents.map((e) => e.slug);
}

export { localBlurbForRegion };
