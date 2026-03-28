import { describe, expect, it } from "vitest";
import type { ReliefWebEntity } from "@/lib/sources/reliefweb-types";
import { mapReliefWebEntityToImpactEvent } from "@/lib/sources/map-reliefweb-to-event";

describe("mapReliefWebEntityToImpactEvent", () => {
  it("maps India-tagged report with high facts confidence", () => {
    const entity: ReliefWebEntity = {
      id: 999001,
      fields: {
        title: "India: monsoon readiness and wheat logistics",
        url: "https://reliefweb.int/report/india-sample",
        body: "Officials discussed wheat stocks and transport corridors.",
        date: { original: "2026-03-01T00:00:00+00:00" },
        country: [{ name: "India" }],
        source: [{ name: "UN OCHA" }],
      },
    };
    const e = mapReliefWebEntityToImpactEvent(entity, "2026-03-28T00:00:00.000Z");
    expect(e).toBeDefined();
    expect(e!.slug).toBe("rw-999001");
    expect(e!.provenance).toBe("reliefweb");
    expect(e!.factsConfidence).toBe("high");
    expect(e!.whatWeKnow[0]).toContain("wheat");
    expect(e!.citations[0].url).toContain("reliefweb");
  });

  it("classifies oil-related headline as energy", () => {
    const entity: ReliefWebEntity = {
      id: 999002,
      fields: {
        title: "Regional update on crude oil shipments",
        url: "https://reliefweb.int/report/oil-sample",
        body: "Markets are watching fuel supply lines.",
        date: { original: "2026-03-02T00:00:00+00:00" },
      },
    };
    const e = mapReliefWebEntityToImpactEvent(entity);
    expect(e?.category).toBe("energy_fuel");
  });

  it("returns null without title or url", () => {
    expect(mapReliefWebEntityToImpactEvent({ id: 1, fields: {} })).toBeNull();
  });
});
