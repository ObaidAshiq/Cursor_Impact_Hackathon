import type { ImpactEvent } from "@/lib/domain";
import { fetchApifyNewsItems } from "@/lib/sources/apify-client";
import type { ApifyNewsItem } from "@/lib/sources/apify-client";
import { mapApifyNewsItemToImpactEvent } from "@/lib/sources/map-apify-news-to-event";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";

export function isSupabaseNewsFeedEnabled(): boolean {
  if (process.env.DISABLE_SUPABASE_NEWS_FEED === "1") return false;
  return isSupabaseConfigured();
}

function syncMaxItems(): number {
  const raw = process.env.APIFY_SYNC_MAX_ITEMS?.trim();
  const parsed = raw ? Number(raw) : 25;
  if (!Number.isFinite(parsed)) return 25;
  return Math.min(50, Math.max(1, Math.floor(parsed)));
}

function minHoursBetweenRuns(): number {
  const raw = process.env.APIFY_SYNC_MIN_HOURS_BETWEEN_RUNS?.trim();
  const parsed = raw ? Number(raw) : 24;
  if (!Number.isFinite(parsed)) return 24;
  return Math.min(168, Math.max(1, parsed));
}

type NewsArticleRow = {
  slug: string;
  title: string;
  url: string;
  publisher: string | null;
  published_at: string | null;
  raw_item: ApifyNewsItem;
  ingested_at: string;
};

export async function getLastNewsSyncAt(): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("apify_sync_state")
    .select("last_run_at")
    .eq("id", 1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  const at = data?.last_run_at;
  return typeof at === "string" ? at : null;
}

function shouldSkipSync(
  lastRunAt: string | null,
  force: boolean,
): { skip: boolean; reason?: string } {
  if (force) return { skip: false };
  if (!lastRunAt) return { skip: false };
  const elapsedMs = Date.now() - new Date(lastRunAt).getTime();
  const minMs = minHoursBetweenRuns() * 60 * 60 * 1000;
  if (elapsedMs < minMs) {
    return {
      skip: true,
      reason: `Last Apify sync was ${Math.round(elapsedMs / 60000)} minutes ago; minimum interval is ${minHoursBetweenRuns()} hours.`,
    };
  }
  return { skip: false };
}

export async function listNewsArticlesFromDb(
  limit: number,
): Promise<{ events: ImpactEvent[]; lastSyncAt: string | null }> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("news_articles")
    .select("slug,title,url,publisher,published_at,raw_item,ingested_at")
    .order("ingested_at", { ascending: false })
    .limit(Math.min(100, Math.max(1, limit)));

  if (error) throw new Error(error.message);

  const rows = (Array.isArray(data) ? data : []) as NewsArticleRow[];
  const lastSyncAt = await getLastNewsSyncAt();

  const events = rows
    .map((row) =>
      mapApifyNewsItemToImpactEvent(row.raw_item, row.ingested_at),
    )
    .filter((e): e is ImpactEvent => Boolean(e));

  return { events, lastSyncAt };
}

export async function getNewsArticleFromDbBySlug(
  slug: string,
): Promise<ImpactEvent | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("news_articles")
    .select("raw_item,ingested_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data || typeof data !== "object") return null;

  const row = data as Pick<NewsArticleRow, "raw_item" | "ingested_at">;
  return mapApifyNewsItemToImpactEvent(row.raw_item, row.ingested_at);
}

export type ApifyNewsSyncResult =
  | { ok: true; skipped: true; reason: string; lastRunAt: string | null }
  | {
      ok: true;
      skipped: false;
      upserted: number;
      lastRunAt: string;
    }
  | { ok: false; error: string };

export async function runApifyNewsSync(options: {
  force?: boolean;
}): Promise<ApifyNewsSyncResult> {
  const { force = false } = options;

  try {
    const lastRunAt = await getLastNewsSyncAt();
    const gate = shouldSkipSync(lastRunAt, force);
    if (gate.skip) {
      return {
        ok: true,
        skipped: true,
        reason: gate.reason ?? "Skipped.",
        lastRunAt,
      };
    }

    const maxItems = syncMaxItems();
    const items = await fetchApifyNewsItems(maxItems, {
      cache: "no-store",
      forSync: true,
    });

    const now = new Date().toISOString();
    const rows: Array<{
      slug: string;
      title: string;
      url: string;
      publisher: string | null;
      published_at: string | null;
      raw_item: ApifyNewsItem;
      ingested_at: string;
    }> = [];

    for (const item of items) {
      const event = mapApifyNewsItemToImpactEvent(item, now);
      if (!event) continue;
      const url = event.citations[0]?.url;
      if (!url) continue;
      rows.push({
        slug: event.slug,
        title: event.title,
        url,
        publisher: event.citations[0]?.publisher ?? null,
        published_at: event.updatedAt,
        raw_item: item,
        ingested_at: now,
      });
    }

    const supabase = getSupabaseAdmin();

    if (rows.length > 0) {
      const { error: upsertError } = await supabase
        .from("news_articles")
        .upsert(rows, { onConflict: "slug" });

      if (upsertError) {
        return { ok: false, error: upsertError.message };
      }
    }

    const { error: stateError } = await supabase.from("apify_sync_state").upsert(
      { id: 1, last_run_at: now },
      { onConflict: "id" },
    );

    if (stateError) {
      return { ok: false, error: stateError.message };
    }

    return {
      ok: true,
      skipped: false,
      upserted: rows.length,
      lastRunAt: now,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
