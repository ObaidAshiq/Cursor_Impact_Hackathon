import type { ReliefWebEntity, ReliefWebListResponse } from "./reliefweb-types";

const BASE = "https://api.reliefweb.int/v2/reports";

function appName(): string {
  return (
    process.env.RELIEFWEB_APPNAME?.trim() || "cursorhackathon-impact-intel"
  );
}

const REVALIDATE_SECONDS = Number(
  process.env.LIVE_FEED_REVALIDATE_SECONDS ?? "120",
);

function fetchInit(): RequestInit {
  return {
    next: { revalidate: REVALIDATE_SECONDS },
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  };
}

export async function fetchReliefWebReportById(
  id: number,
): Promise<ReliefWebEntity | null> {
  const url = `${BASE}/${id}?appname=${encodeURIComponent(appName())}`;
  const res = await fetch(url, fetchInit());
  if (!res.ok) return null;
  const json: unknown = await res.json();
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  if (Array.isArray(o.data) && o.data[0] && typeof o.data[0] === "object") {
    return o.data[0] as ReliefWebEntity;
  }
  if (
    o.data &&
    typeof o.data === "object" &&
    "id" in (o.data as object) &&
    typeof (o.data as ReliefWebEntity).id === "number"
  ) {
    return o.data as ReliefWebEntity;
  }
  if (typeof o.id === "number") return json as ReliefWebEntity;
  return null;
}

export async function fetchReliefWebLatestReports(
  limit = 20,
): Promise<ReliefWebEntity[]> {
  const url = new URL(BASE);
  url.searchParams.set("appname", appName());
  url.searchParams.set("limit", String(Math.min(100, Math.max(1, limit))));

  const res = await fetch(url.toString(), fetchInit());
  const json: ReliefWebListResponse = await res.json();

  if (!res.ok) {
    const msg =
      json?.message || json?.title || `ReliefWeb HTTP ${res.status}`;
    throw new Error(msg);
  }

  return Array.isArray(json.data) ? json.data : [];
}
