import { beforeEach, describe, expect, it, vi } from "vitest";

const { fromMock, getSupabaseAdminMock } = vi.hoisted(() => {
  const fromMock = vi.fn();
  const getSupabaseAdminMock = vi.fn(() => ({
    from: fromMock,
  }));
  return { fromMock, getSupabaseAdminMock };
});

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdmin: getSupabaseAdminMock,
}));

import {
  buildImpactEventSourceHash,
  isImpactEvent,
  listStoredImpactEvents,
} from "@/lib/supabase/impact-events";
import type { ImpactEvent } from "@/lib/domain";

function makeEvent(overrides: Partial<ImpactEvent> = {}): ImpactEvent {
  return {
    slug: "ap-test",
    title: "Shipping and oil signals may raise fuel and freight costs",
    category: "energy_fuel",
    severity: 4,
    horizon: "days",
    updatedAt: "2026-03-28T00:00:00.000Z",
    whatWeKnow: ["Fuel and freight costs may rise after shipping disruption reports."],
    whatWeInfer: ["India could feel the impact through transport and imported fuel prices."],
    indiaImpact:
      "India could feel this through imported energy costs, freight charges, and downstream pricing.",
    mostAffectedPersonas: ["commuter", "small_business_owner", "importer"],
    citations: [
      {
        id: "citation-1",
        title: "Sample citation",
        url: "https://example.com/story",
        publisher: "Example News",
        retrievedAt: "2026-03-28T00:00:00.000Z",
        kind: "media",
      },
    ],
    factsConfidence: "medium",
    inferConfidence: "low",
    actionsByPersona: {
      commuter: ["Watch official advisories before changing fuel-buying behavior."],
    },
    provenance: "apify",
    ...overrides,
  };
}

describe("impact event storage helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts valid ImpactEvent payloads", () => {
    expect(isImpactEvent(makeEvent())).toBe(true);
    expect(isImpactEvent({ slug: "bad" })).toBe(false);
  });

  it("ignores AI-only fields when building source hashes", () => {
    const base = makeEvent();
    const withAi = makeEvent({
      narrativeRefinedWithGemini: true,
      aiError: "quota",
      aiModel: "gemini-2.5-flash",
      aiRefinedFields: { whatWeInfer: true },
    });

    expect(buildImpactEventSourceHash(base)).toBe(buildImpactEventSourceHash(withAi));
  });

  it("deserializes stored rows into ImpactEvent values", async () => {
    const event = makeEvent();
    const orderMock = vi.fn().mockResolvedValue({
      data: [
        {
          slug: event.slug,
          event,
          category: event.category,
          updated_at: event.updatedAt,
          provenance: event.provenance,
          source_hash: "hash",
        },
      ],
      error: null,
    });
    const selectMock = vi.fn().mockReturnValue({ order: orderMock });
    fromMock.mockReturnValue({ select: selectMock });

    const events = await listStoredImpactEvents();

    expect(events).toEqual([event]);
    expect(getSupabaseAdminMock).toHaveBeenCalled();
  });
});
