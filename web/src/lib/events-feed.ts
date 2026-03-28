import { seedEvents } from "@/data/seed-events";
import type { ImpactEvent, Persona, UserNeedCard } from "@/lib/domain";
import {
  getEventBySlug,
  type EventListFilters,
  listEvents,
  localBlurbForRegion,
} from "@/lib/events";
import { buildUserNeedsFromEvents, resolveUserNeedFromEvent } from "@/lib/user-needs";
import { fetchReliefWebReportById } from "@/lib/sources/reliefweb-client";
import { fetchEiaBrentSpotDaily, isEiaConfigured } from "@/lib/sources/eia-client";
import {
  buildEiaPetroleumSnapshotEvent,
  EIA_PETROLEUM_SNAPSHOT_SLUG,
} from "@/lib/sources/map-eia-snapshot-event";
import { mapReliefWebEntityToImpactEvent } from "@/lib/sources/map-reliefweb-to-event";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import {
  getStoredImpactEventBySlug,
  listStoredImpactEvents,
} from "@/lib/supabase/impact-events";

async function loadStoredApifyEvents(): Promise<{
  events: ImpactEvent[];
  apifyError?: string;
  liveFetchedAt?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { events: [] };
  }

  try {
    const events = await listStoredImpactEvents({ provenance: "apify" });
    return {
      events,
      liveFetchedAt: events[0]?.updatedAt,
    };
  } catch (err) {
    return {
      events: [],
      apifyError:
        err instanceof Error ? err.message : "Stored live events could not be loaded.",
    };
  }
}

export type FeedResult = {
  events: ImpactEvent[];
  apifyError?: string;
  liveFetchedAt?: string;
  eiaError?: string;
  geminiError?: string;
};

export type UserNeedFeedResult = Omit<FeedResult, "events"> & {
  needs: UserNeedCard[];
};

async function loadFeedEvents(
  filters: EventListFilters = {},
): Promise<FeedResult> {
  const fetchedAt = new Date().toISOString();
  const {
    events: apifyNews,
    apifyError,
    liveFetchedAt,
  } = await loadStoredApifyEvents();
  let eiaError: string | undefined;
  let eiaEvent: ImpactEvent | null = null;

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
  return {
    events: listed,
    apifyError,
    liveFetchedAt,
    eiaError,
    geminiError: undefined,
  };
}

export async function listEventsForFeed(
  filters: EventListFilters = {},
): Promise<FeedResult> {
  return loadFeedEvents(filters);
}

export async function listUserNeedsForFeed(
  filters: EventListFilters & { region?: string } = {},
): Promise<UserNeedFeedResult> {
  const { events, apifyError, liveFetchedAt, eiaError, geminiError } =
    await loadFeedEvents(filters);
  const needs = buildUserNeedsFromEvents(events, filters);
  return {
    needs,
    apifyError,
    liveFetchedAt,
    eiaError,
    geminiError,
  };
}

export async function getEventBySlugResolved(
  slug: string,
): Promise<ImpactEvent | undefined> {
  if (isSupabaseConfigured()) {
    try {
      const stored = await getStoredImpactEventBySlug(slug);
      if (stored) return stored;
    } catch {
      // Fall back to non-stored paths below.
    }
  }

  if (slug === EIA_PETROLEUM_SNAPSHOT_SLUG) {
    if (!isEiaConfigured()) return undefined;
    try {
      const rows = await fetchEiaBrentSpotDaily(5);
      const ev =
        buildEiaPetroleumSnapshotEvent(
          rows,
          new Date().toISOString(),
        ) ?? undefined;
      return ev;
    } catch {
      return undefined;
    }
  }
  if (slug.startsWith("ap-")) return undefined;
  if (slug.startsWith("rw-")) {
    const raw = slug.slice(3);
    const id = Number(raw);
    if (!Number.isFinite(id)) return undefined;
    const entity = await fetchReliefWebReportById(id);
    if (!entity) return undefined;
    const ev =
      mapReliefWebEntityToImpactEvent(entity, new Date().toISOString()) ??
      undefined;
    return ev;
  }
  const curated = getEventBySlug(slug);
  return curated;
}

export function getStaticEventSlugs(): string[] {
  return seedEvents.map((e) => e.slug);
}

export async function getUserNeedBySlugResolved(
  slug: string,
  options: { persona?: Persona | "all"; region?: string } = {},
): Promise<{ event: ImpactEvent; need: UserNeedCard } | undefined> {
  const event = await getEventBySlugResolved(slug);
  if (!event) return undefined;
  return {
    event,
    need: resolveUserNeedFromEvent(event, options),
  };
}

export { localBlurbForRegion };
