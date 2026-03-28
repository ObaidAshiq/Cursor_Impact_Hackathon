import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ImpactEvent } from "@/lib/domain";

const {
  isSupabaseConfiguredMock,
  listStoredImpactEventsMock,
  getStoredImpactEventBySlugMock,
  isEiaConfiguredMock,
  fetchEiaBrentSpotDailyMock,
  buildEiaPetroleumSnapshotEventMock,
  fetchReliefWebReportByIdMock,
  mapReliefWebEntityToImpactEventMock,
} = vi.hoisted(() => ({
  isSupabaseConfiguredMock: vi.fn(),
  listStoredImpactEventsMock: vi.fn(),
  getStoredImpactEventBySlugMock: vi.fn(),
  isEiaConfiguredMock: vi.fn(),
  fetchEiaBrentSpotDailyMock: vi.fn(),
  buildEiaPetroleumSnapshotEventMock: vi.fn(),
  fetchReliefWebReportByIdMock: vi.fn(),
  mapReliefWebEntityToImpactEventMock: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  isSupabaseConfigured: isSupabaseConfiguredMock,
}));

vi.mock("@/lib/supabase/impact-events", () => ({
  listStoredImpactEvents: listStoredImpactEventsMock,
  getStoredImpactEventBySlug: getStoredImpactEventBySlugMock,
}));

vi.mock("@/lib/sources/eia-client", () => ({
  isEiaConfigured: isEiaConfiguredMock,
  fetchEiaBrentSpotDaily: fetchEiaBrentSpotDailyMock,
}));

vi.mock("@/lib/sources/map-eia-snapshot-event", () => ({
  EIA_PETROLEUM_SNAPSHOT_SLUG: "eia-petroleum",
  buildEiaPetroleumSnapshotEvent: buildEiaPetroleumSnapshotEventMock,
}));

vi.mock("@/lib/sources/reliefweb-client", () => ({
  fetchReliefWebReportById: fetchReliefWebReportByIdMock,
}));

vi.mock("@/lib/sources/map-reliefweb-to-event", () => ({
  mapReliefWebEntityToImpactEvent: mapReliefWebEntityToImpactEventMock,
}));

import {
  getEventBySlugResolved,
  listEventsForFeed,
} from "@/lib/events-feed";

function makeEvent(slug: string, title: string): ImpactEvent {
  return {
    slug,
    title,
    category: "energy_fuel",
    severity: 3,
    horizon: "days",
    updatedAt: "2026-03-28T00:00:00.000Z",
    whatWeKnow: [title],
    whatWeInfer: ["India could feel this through transport costs."],
    indiaImpact: "India could feel this through transport costs.",
    mostAffectedPersonas: ["commuter", "small_business_owner", "importer"],
    citations: [
      {
        id: `${slug}-citation`,
        title,
        url: `https://example.com/${slug}`,
        publisher: "Example News",
        retrievedAt: "2026-03-28T00:00:00.000Z",
        kind: "media",
      },
    ],
    factsConfidence: "medium",
    inferConfidence: "low",
    actionsByPersona: {
      commuter: ["Watch official advisories before changing travel plans."],
    },
    provenance: "apify",
  };
}

describe("events-feed Supabase reads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isSupabaseConfiguredMock.mockReturnValue(true);
    isEiaConfiguredMock.mockReturnValue(false);
  });

  it("uses stored Supabase events in the feed", async () => {
    const storedEvent = makeEvent(
      "ap-1",
      "Shipping and oil signals may raise fuel and freight costs",
    );
    listStoredImpactEventsMock.mockResolvedValue([storedEvent]);

    const result = await listEventsForFeed();

    expect(listStoredImpactEventsMock).toHaveBeenCalledWith({ provenance: "apify" });
    expect(result.events[0]?.slug).toBe("ap-1");
    expect(result.liveFetchedAt).toBe(storedEvent.updatedAt);
  });

  it("resolves stored Supabase events by slug before fallback paths", async () => {
    const storedEvent = makeEvent(
      "ap-1",
      "Shipping and oil signals may raise fuel and freight costs",
    );
    getStoredImpactEventBySlugMock.mockResolvedValue(storedEvent);

    const event = await getEventBySlugResolved("ap-1");

    expect(event).toEqual(storedEvent);
    expect(getStoredImpactEventBySlugMock).toHaveBeenCalledWith("ap-1");
    expect(fetchReliefWebReportByIdMock).not.toHaveBeenCalled();
  });
});
