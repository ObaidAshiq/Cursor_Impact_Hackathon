import { ApifyClient } from "apify-client";
import { unstable_cache } from "next/cache";

export type ApifyNewsItem = Record<string, unknown>;

function apifyToken(): string | undefined {
  const token = process.env.APIFY_API_TOKEN?.trim();
  return token || undefined;
}

function apifyActorId(): string | undefined {
  const actorId =
    process.env.APIFY_NEWS_ACTOR_ID?.trim() || "codingfrontend/google-news-scraper";
  return actorId || undefined;
}

function revalidateSeconds(): number {
  return Number(process.env.LIVE_FEED_REVALIDATE_SECONDS ?? "120");
}

function newsLimit(): number {
  const raw = process.env.APIFY_NEWS_LIMIT?.trim();
  const parsed = raw ? Number(raw) : 12;
  if (!Number.isFinite(parsed)) return 12;
  return Math.min(25, Math.max(1, Math.floor(parsed)));
}

export function isApifyNewsConfigured(): boolean {
  if (process.env.DISABLE_APIFY_NEWS_FEED === "1") return false;
  return Boolean(apifyToken() && apifyActorId());
}

/**
 * Reads items from the actor's most recent successful run dataset.
 * The actor itself is scheduled on the Apify Console -- we never trigger runs.
 */
async function readLastSuccessfulDataset(
  limit: number,
): Promise<ApifyNewsItem[]> {
  const token = apifyToken();
  const actorId = apifyActorId();
  if (!token || !actorId) return [];

  const client = new ApifyClient({ token });
  const runClient = client.actor(actorId).lastRun({ status: "SUCCEEDED" });
  await runClient.get();

  const { items } = await runClient
    .dataset()
    .listItems({ limit, clean: true });

  return (items ?? []).filter(
    (item): item is ApifyNewsItem =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
}

const fetchApifyNewsCached = unstable_cache(
  (limit: number) => readLastSuccessfulDataset(limit),
  ["apify-news"],
  { revalidate: revalidateSeconds() },
);

export async function fetchApifyNewsItems(
  limit = newsLimit(),
): Promise<ApifyNewsItem[]> {
  if (!isApifyNewsConfigured()) return [];
  return fetchApifyNewsCached(limit);
}
