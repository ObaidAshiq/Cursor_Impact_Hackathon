/**
 * U.S. EIA Open Data API v2 — petroleum spot prices.
 * https://www.eia.gov/opendata/documentation.php
 */

const BASE = "https://api.eia.gov/v2/petroleum/pri/spt/data/";

export type EiaSpotRow = {
  period: string;
  value: number | null;
  product?: string;
  unit?: string;
};

type EiaV2Response = {
  response?: {
    data?: Array<{
      period?: string;
      value?: number | string | null;
      product?: string;
      "product-name"?: string;
      unit?: string;
    }>;
  };
  error?: string;
};

function apiKey(): string | undefined {
  const k = process.env.EIA_API_KEY?.trim();
  return k || undefined;
}

function revalidateSeconds(): number {
  return Number(process.env.LIVE_FEED_REVALIDATE_SECONDS ?? "120");
}

function buildUrl(productCode: string, length: number): string {
  const key = apiKey();
  if (!key) throw new Error("EIA_API_KEY is not set");

  const params = new URLSearchParams();
  params.set("api_key", key);
  params.set("frequency", "daily");
  params.append("data[0]", "value");
  params.append("facets[product][]", productCode);
  params.append("sort[0][column]", "period");
  params.append("sort[0][direction]", "desc");
  params.set("length", String(Math.min(100, Math.max(1, length))));

  return `${BASE}?${params.toString()}`;
}

function normalizeRows(
  json: EiaV2Response,
  productCode: string,
): EiaSpotRow[] {
  const raw = json.response?.data;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      const v = row.value;
      const num =
        v === null || v === undefined || v === ""
          ? null
          : typeof v === "number"
            ? v
            : Number(v);
      return {
        period: String(row.period ?? ""),
        value: Number.isFinite(num) ? num : null,
        product: row.product ?? productCode,
        unit: row.unit ?? "$/BBL",
      };
    })
    .filter((r) => r.period.length > 0);
}

/**
 * Latest daily Brent Europe spot rows (newest first).
 */
export async function fetchEiaBrentSpotDaily(
  length = 5,
): Promise<EiaSpotRow[]> {
  if (!apiKey()) return [];

  const url = buildUrl("EPCBRENT", length);
  const res = await fetch(url, {
    next: { revalidate: revalidateSeconds() },
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  });

  const json: EiaV2Response = await res.json();
  if (!res.ok) {
    const msg = json.error || `EIA HTTP ${res.status}`;
    throw new Error(msg);
  }

  return normalizeRows(json, "EPCBRENT");
}

export function isEiaConfigured(): boolean {
  return Boolean(apiKey());
}
