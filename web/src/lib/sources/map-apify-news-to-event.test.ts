import { describe, expect, it } from "vitest";
import { mapApifyNewsItemToImpactEvent } from "@/lib/sources/map-apify-news-to-event";

describe("mapApifyNewsItemToImpactEvent", () => {
  it("maps a media item into an ImpactEvent", () => {
    const event = mapApifyNewsItemToImpactEvent(
      {
        title: "India watches crude oil shipping disruption in Gulf route",
        url: "https://example.com/news/crude-shipping",
        source: "Example News",
        publishedAt: "2026-03-28T10:15:00.000Z",
        description:
          "A developing shipping disruption is raising questions about crude flows and import costs.",
      },
      "2026-03-28T11:00:00.000Z",
    );

    expect(event).toBeDefined();
    expect(event?.provenance).toBe("apify");
    expect(event?.category).toBe("energy_fuel");
    expect(event?.citations[0].kind).toBe("media");
    expect(event?.slug.startsWith("ap-")).toBe(true);
  });

  it("maps actor outputs that use capitalized field names", () => {
    const event = mapApifyNewsItemToImpactEvent(
      {
        Title: "India watches crude oil shipping disruption in Gulf route",
        URL: "https://example.com/news/crude-shipping",
        Publisher: "Example News",
        Published: "2026-03-28T10:15:00.000Z",
        Summary:
          "A developing shipping disruption is raising questions about crude flows and import costs.",
      },
      "2026-03-28T11:00:00.000Z",
    );

    expect(event).toBeDefined();
    expect(event?.title).toBe("Shipping and oil signals may raise fuel and freight costs");
    expect(event?.citations[0].url).toBe("https://example.com/news/crude-shipping");
    expect(event?.whatWeKnow[0]).toContain("shipping disruption");
  });

  it("returns null when the article lacks title or url", () => {
    expect(mapApifyNewsItemToImpactEvent({ title: "Missing link" })).toBeNull();
    expect(
      mapApifyNewsItemToImpactEvent({ url: "https://example.com/no-title" }),
    ).toBeNull();
  });
});
