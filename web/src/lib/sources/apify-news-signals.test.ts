import { describe, expect, it } from "vitest";
import {
  mapApifyNewsItemToSignal,
  mergeApifyNewsSignals,
} from "@/lib/sources/apify-news-signals";

describe("apify news signal pipeline", () => {
  it("normalizes capitalized fields and merges related articles", () => {
    const retrievedAt = "2026-03-28T11:00:00.000Z";
    const first = mapApifyNewsItemToSignal(
      {
        Title: "Oil shipping disruption raises freight pressure",
        URL: "https://example.com/oil-shipping-1",
        Publisher: "Example News",
        Published: "2026-03-28T10:15:00.000Z",
        Summary:
          "Shipping disruption in a major route is raising crude and freight concerns for importers.",
      },
      retrievedAt,
    );
    const second = mapApifyNewsItemToSignal(
      {
        Title: "Crude freight risk grows as shipping route faces disruption",
        URL: "https://example.com/oil-shipping-2",
        Publisher: "Global Times",
        Published: "2026-03-28T10:45:00.000Z",
        Summary:
          "Freight risk is increasing as markets track disruption on a major shipping route.",
      },
      retrievedAt,
    );

    expect(first).toBeDefined();
    expect(second).toBeDefined();

    const events = mergeApifyNewsSignals([first!, second!]);
    expect(events).toHaveLength(1);
    expect(events[0]?.citations).toHaveLength(2);
    expect(events[0]?.category).toBe("energy_fuel");
    expect(events[0]?.title).toBe("Shipping and oil signals may raise fuel and freight costs");
    expect(events[0]?.whatWeKnow[1]).toContain("2 recent reports");
  });

  it("keeps unrelated stories as separate events", () => {
    const retrievedAt = "2026-03-28T11:00:00.000Z";
    const shipping = mapApifyNewsItemToSignal(
      {
        Title: "Oil shipping disruption raises freight pressure",
        URL: "https://example.com/oil-shipping-1",
        Publisher: "Example News",
        Published: "2026-03-28T10:15:00.000Z",
        Summary:
          "Shipping disruption in a major route is raising crude and freight concerns for importers.",
      },
      retrievedAt,
    );
    const rates = mapApifyNewsItemToSignal(
      {
        Title: "Rate outlook shifts after inflation reading",
        URL: "https://example.com/rates-1",
        Publisher: "Market Desk",
        Published: "2026-03-28T10:20:00.000Z",
        Summary:
          "Banks and borrowers are watching inflation after a fresh policy outlook update.",
      },
      retrievedAt,
    );

    const events = mergeApifyNewsSignals([shipping!, rates!]);
    expect(events).toHaveLength(2);
  });
});
