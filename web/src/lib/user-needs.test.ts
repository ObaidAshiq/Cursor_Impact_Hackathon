import { describe, expect, it } from "vitest";
import type { ImpactEvent } from "@/lib/domain";
import {
  buildUserNeedsFromEvents,
  mapImpactEventToUserNeeds,
  resolveUserNeedFromEvent,
} from "@/lib/user-needs";

function makeEvent(overrides: Partial<ImpactEvent> = {}): ImpactEvent {
  return {
    slug: "sample-event",
    title: "Shipping disruption raises fuel and freight costs",
    category: "energy_fuel",
    severity: 4,
    horizon: "days",
    updatedAt: "2026-03-28T00:00:00.000Z",
    whatWeKnow: [
      "Fuel and freight costs may rise after shipping disruption reports.",
    ],
    whatWeInfer: [
      "Households and businesses may feel the effect through transport and delivery charges.",
    ],
    indiaImpact:
      "India could feel the impact through transport costs and imported fuel prices.",
    localNotes: {
      mumbai:
        "High reliance on road freight and dense commuting can make fuel and taxi costs more visible early.",
      delhi:
        "Wholesale mandis and large retail chains often reflect policy changes within days.",
    },
    mostAffectedPersonas: ["commuter", "small_business_owner", "importer"],
    citations: [
      {
        id: "sample-citation",
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
      commuter: [
        "Watch official local advisories before changing travel or fuel-buying plans.",
      ],
      small_business_owner: [
        "Confirm supplier and freight changes before repricing customers.",
      ],
      importer: [
        "Review shipping, customs, and currency exposure before acting.",
      ],
    },
    provenance: "apify",
    ...overrides,
  };
}

describe("user needs", () => {
  it("maps one impact event into persona-specific user needs", () => {
    const event = makeEvent();

    const needs = mapImpactEventToUserNeeds(event, {
      persona: "all",
      region: "mumbai",
    });

    expect(needs).toHaveLength(3);
    expect(needs.map((need) => need.persona)).toEqual([
      "commuter",
      "small_business_owner",
      "importer",
    ]);
    expect(needs[0]?.title).toContain("For commuter:");
    expect(needs[0]?.title).toContain(event.title);
    expect(needs[0]?.summary).toContain("fuel and taxi");
    expect(needs[0]?.regionBlurb).toContain("fuel and taxi");
  });

  it("uses persona-specific actions and conservative confidence", () => {
    const event = makeEvent({
      slug: "wheat-export-policy-shift",
      title: "Policy or trade change affecting staple grain flows",
      category: "food_supply_chain",
      severity: 3,
      horizon: "months",
      whatWeKnow: [
        "Export or stockholding rules for staples can change with short notice during price or weather stress.",
      ],
      whatWeInfer: [
        "Retail atta and bakery channels may adjust more slowly than wholesale mandi prices.",
      ],
      indiaImpact:
        "Household staples and food service input costs can shift through multiple channels.",
      localNotes: {
        delhi:
          "Wholesale mandis and large retail chains often reflect policy changes within days; watch local mandi bulletins.",
      },
      mostAffectedPersonas: ["farmer", "student", "small_business_owner"],
      factsConfidence: "low",
      inferConfidence: "medium",
      actionsByPersona: {
        student: [
          "Staple price moves are usually gradual; plan a modest buffer for mess or grocery costs if you are on a tight budget.",
        ],
      },
    });

    const need = resolveUserNeedFromEvent(event, {
      persona: "student",
      region: "delhi",
    });

    expect(need.persona).toBe("student");
    expect(need.recommendedActions[0]).toContain("Staple price moves");
    expect(need.confidence).toBe("low");
    expect(need.regionBlurb).toContain("Wholesale mandis");
  });

  it("filters and ranks user needs for the requested persona", () => {
    const commuterEvent = makeEvent({
      slug: "strait-hormuz-shipping-disruption",
      severity: 4,
      horizon: "immediate",
    });
    const studentEvent = makeEvent({
      slug: "rbi-policy-rate-update",
      title: "Reserve Bank policy update affects borrowing conditions",
      category: "economic_policy",
      severity: 3,
      horizon: "months",
      mostAffectedPersonas: ["student", "small_business_owner", "commuter"],
    });

    const needs = buildUserNeedsFromEvents([studentEvent, commuterEvent], {
      persona: "commuter",
      region: "mumbai",
    });

    expect(needs).toHaveLength(2);
    expect(needs.every((need) => need.persona === "commuter")).toBe(true);
    expect(needs[0]?.sourceEventSlug).toBe("strait-hormuz-shipping-disruption");
    expect(needs[0]?.urgency).toBe("high");
  });
});
