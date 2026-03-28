import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ImpactEvent } from "@/lib/domain";

const {
  isSupabaseConfiguredMock,
  isApifyNewsConfiguredMock,
  fetchApifyNewsItemsMock,
  mapApifyNewsItemToSignalMock,
  mergeApifyNewsSignalsMock,
  getStoredImpactEventsBySlugsMock,
  upsertImpactEventsMock,
  deleteStaleApifyEventsMock,
  buildImpactEventSourceHashMock,
  isGeminiEnabledMock,
  enrichEventWithGeminiMock,
} = vi.hoisted(() => ({
  isSupabaseConfiguredMock: vi.fn(),
  isApifyNewsConfiguredMock: vi.fn(),
  fetchApifyNewsItemsMock: vi.fn(),
  mapApifyNewsItemToSignalMock: vi.fn(),
  mergeApifyNewsSignalsMock: vi.fn(),
  getStoredImpactEventsBySlugsMock: vi.fn(),
  upsertImpactEventsMock: vi.fn(),
  deleteStaleApifyEventsMock: vi.fn(),
  buildImpactEventSourceHashMock: vi.fn(),
  isGeminiEnabledMock: vi.fn(),
  enrichEventWithGeminiMock: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  isSupabaseConfigured: isSupabaseConfiguredMock,
}));

vi.mock("@/lib/sources/apify-client", () => ({
  isApifyNewsConfigured: isApifyNewsConfiguredMock,
  fetchApifyNewsItems: fetchApifyNewsItemsMock,
}));

vi.mock("@/lib/sources/apify-news-signals", () => ({
  mapApifyNewsItemToSignal: mapApifyNewsItemToSignalMock,
  mergeApifyNewsSignals: mergeApifyNewsSignalsMock,
}));

vi.mock("@/lib/supabase/impact-events", () => ({
  getStoredImpactEventsBySlugs: getStoredImpactEventsBySlugsMock,
  upsertImpactEvents: upsertImpactEventsMock,
  deleteStaleApifyEvents: deleteStaleApifyEventsMock,
  buildImpactEventSourceHash: buildImpactEventSourceHashMock,
}));

vi.mock("@/lib/ai/gemini-enrich", () => ({
  isGeminiEnabled: isGeminiEnabledMock,
  enrichEventWithGemini: enrichEventWithGeminiMock,
}));

import { ingestImpactEvents } from "@/lib/jobs/ingest-impact-events";

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

describe("ingestImpactEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_INGEST_LIMIT = "0";
    isSupabaseConfiguredMock.mockReturnValue(true);
    isApifyNewsConfiguredMock.mockReturnValue(true);
    isGeminiEnabledMock.mockReturnValue(false);
    fetchApifyNewsItemsMock.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    mapApifyNewsItemToSignalMock.mockImplementation((item) => ({ id: item.id }));
    buildImpactEventSourceHashMock.mockImplementation(
      (event: ImpactEvent) => `${event.slug}:${event.title}`,
    );
    getStoredImpactEventsBySlugsMock.mockResolvedValue(new Map());
    upsertImpactEventsMock.mockResolvedValue(undefined);
    deleteStaleApifyEventsMock.mockResolvedValue(1);
  });

  it("stores merged baseline events and removes stale slugs", async () => {
    const mergedEvents = [
      makeEvent("ap-1", "Shipping and oil signals may raise fuel and freight costs"),
    ];
    mergeApifyNewsSignalsMock.mockReturnValue(mergedEvents);

    const result = await ingestImpactEvents();

    expect(upsertImpactEventsMock).toHaveBeenCalledWith(
      mergedEvents,
      expect.objectContaining({
        jobRunId: expect.stringMatching(/^apify-/),
      }),
    );
    expect(deleteStaleApifyEventsMock).toHaveBeenCalledWith(["ap-1"]);
    expect(result.storedEventCount).toBe(1);
    expect(result.staleDeletedCount).toBe(1);
    expect(result.geminiRefinedCount).toBe(0);
  });

  it("reuses unchanged stored AI events and enriches only changed rows", async () => {
    process.env.GEMINI_INGEST_LIMIT = "1";
    isGeminiEnabledMock.mockReturnValue(true);

    const unchanged = makeEvent("ap-1", "Shipping and oil signals may raise fuel and freight costs");
    const changed = makeEvent("ap-2", "Rate and inflation signals may affect credit and business costs");
    const reusedStored = {
      ...unchanged,
      narrativeRefinedWithGemini: true,
      aiModel: "gemini-2.5-flash",
    };
    const enrichedChanged = {
      ...changed,
      narrativeRefinedWithGemini: true,
      aiModel: "gemini-2.5-flash",
    };

    mergeApifyNewsSignalsMock.mockReturnValue([unchanged, changed]);
    getStoredImpactEventsBySlugsMock.mockResolvedValue(
      new Map<string, ImpactEvent>([
        [unchanged.slug, reusedStored],
        [changed.slug, { ...changed, title: "Old changed title" }],
      ]),
    );
    enrichEventWithGeminiMock.mockResolvedValue(enrichedChanged);

    const result = await ingestImpactEvents();

    expect(enrichEventWithGeminiMock).toHaveBeenCalledTimes(1);
    expect(enrichEventWithGeminiMock).toHaveBeenCalledWith(changed);
    expect(upsertImpactEventsMock).toHaveBeenCalledWith(
      [reusedStored, enrichedChanged],
      expect.objectContaining({
        jobRunId: expect.stringMatching(/^apify-/),
      }),
    );
    expect(result.geminiRefinedCount).toBe(1);
  });
});
