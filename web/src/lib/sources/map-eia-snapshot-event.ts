import type { ImpactEvent } from "@/lib/domain";
import type { EiaSpotRow } from "@/lib/sources/eia-client";

/** Stable slug for the live EIA petroleum snapshot card. */
export const EIA_PETROLEUM_SNAPSHOT_SLUG = "eia-petroleum-spot-snapshot";

const EIA_BROWSER_URL =
  "https://www.eia.gov/opendata/browser/petroleum/pri/spt";

export function buildEiaPetroleumSnapshotEvent(
  brentRows: EiaSpotRow[],
  retrievedAt: string,
): ImpactEvent | null {
  const latest = brentRows[0];
  if (!latest || latest.value === null) return null;

  const unit = latest.unit ?? "$/BBL";
  const history = brentRows.slice(1, 5).map((r) => {
    const v = r.value === null ? "n/a" : String(r.value);
    return `${r.period}: ${v} ${r.unit ?? unit}`;
  });

  return {
    slug: EIA_PETROLEUM_SNAPSHOT_SLUG,
    title: "Global crude benchmark snapshot (EIA — Brent Europe spot)",
    category: "energy_fuel",
    severity: 2,
    horizon: "days",
    updatedAt: retrievedAt,
    whatWeKnow: [
      `Latest daily observation in this pull: ${latest.value} ${unit} for ${latest.period} (Brent Europe spot, EPCBRENT, U.S. EIA).`,
      ...history.map((h) => `Prior trading date in series: ${h}.`),
    ],
    whatWeInfer: [
      "Brent is a widely watched crude benchmark; it can move in the same direction as India’s crude import costs over time, but India’s retail fuel prices also depend on the rupee, taxes, subsidies, and refinery margins.",
      "Do not treat this number as a forecast—check PPAC and ministry releases for India-specific pricing context.",
    ],
    indiaImpact:
      "India imports most of its crude. When global benchmarks rise or fall, import costs often adjust, but the pass-through to petrol and diesel at the pump is not one-to-one and is shaped by policy.",
    localNotes: {
      mumbai:
        "Metro areas feel pump and freight costs quickly when wholesale economics shift; confirm with local retail notices.",
      delhi:
        "NCR transport and logistics intensity can make diesel-driven costs visible in goods prices.",
    },
    mostAffectedPersonas: ["commuter", "small_business_owner", "importer", "farmer"],
    citations: [
      {
        id: "eia-opendata",
        title: "EIA Open Data — Petroleum spot prices",
        url: EIA_BROWSER_URL,
        publisher: "U.S. Energy Information Administration",
        retrievedAt,
        kind: "data",
      },
      {
        id: "ppac-in",
        title: "PPAC — Petroleum Planning & Analysis Cell (India)",
        url: "https://ppac.gov.in/",
        publisher: "Government of India",
        retrievedAt,
        kind: "official",
      },
    ],
    factsConfidence: "high",
    inferConfidence: "medium",
    actionsByPersona: {
      commuter: [
        "Use this as context only; watch official retail bulletins and PPAC for India-specific fuel economics.",
        "Avoid reacting to a single daily print—look at a week or two of movement.",
      ],
      small_business_owner: [
        "If diesel is a major input, stress-test budgets for a modest band of price movement around the recent trend.",
      ],
      importer: [
        "Reconcile benchmark moves with your actual crude or product sourcing basis and hedging, if any.",
      ],
      farmer: [
        "Fuel for pumps and transport can move with diesel; verify local mandi and scheme notices separately.",
      ],
    },
    provenance: "eia",
    externalId: "EPCBRENT-daily",
  };
}
