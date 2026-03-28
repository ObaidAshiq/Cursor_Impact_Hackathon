import { describe, expect, it } from "vitest";
import {
  buildEiaPetroleumSnapshotEvent,
  EIA_PETROLEUM_SNAPSHOT_SLUG,
} from "@/lib/sources/map-eia-snapshot-event";

describe("buildEiaPetroleumSnapshotEvent", () => {
  it("builds energy event from Brent rows", () => {
    const e = buildEiaPetroleumSnapshotEvent(
      [
        { period: "2026-03-26", value: 72.4, unit: "$/BBL" },
        { period: "2026-03-25", value: 71.9, unit: "$/BBL" },
      ],
      "2026-03-28T00:00:00.000Z",
    );
    expect(e).toBeDefined();
    expect(e!.slug).toBe(EIA_PETROLEUM_SNAPSHOT_SLUG);
    expect(e!.provenance).toBe("eia");
    expect(e!.category).toBe("energy_fuel");
    expect(e!.whatWeKnow[0]).toContain("72.4");
  });

  it("returns null without a numeric latest value", () => {
    expect(
      buildEiaPetroleumSnapshotEvent(
        [{ period: "2026-03-26", value: null }],
        "2026-03-28T00:00:00.000Z",
      ),
    ).toBeNull();
  });
});
