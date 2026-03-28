import { describe, expect, it } from "vitest";
import {
  getEventBySlug,
  listEvents,
  localBlurbForRegion,
} from "@/lib/events";

describe("events helpers", () => {
  it("returns event by slug", () => {
    const e = getEventBySlug("rbi-policy-rate-update");
    expect(e).toBeDefined();
    expect(e?.title).toContain("Reserve Bank");
  });

  it("filters by category", () => {
    const energy = listEvents({ category: "energy_fuel", persona: "all" });
    expect(energy.every((x) => x.category === "energy_fuel")).toBe(true);
    expect(energy.length).toBeGreaterThan(0);
  });

  it("filters by persona", () => {
    const forCommuter = listEvents({ category: "all", persona: "commuter" });
    expect(
      forCommuter.every((e) => e.mostAffectedPersonas.includes("commuter")),
    ).toBe(true);
  });

  it("returns local blurb when region matches", () => {
    const e = getEventBySlug("strait-hormuz-shipping-disruption");
    expect(e).toBeDefined();
    expect(localBlurbForRegion(e!, "mumbai")).toBeTruthy();
    expect(localBlurbForRegion(e!, "unknown")).toBeNull();
  });
});
