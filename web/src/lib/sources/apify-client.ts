import { ApifyClient } from "apify-client";
import { unstable_cache } from "next/cache";

export type ApifyNewsItem = Record<string, unknown>;

/** Max wall-clock time for one cron/sync job to wait on the actor before reading the dataset (partial OK). */
function syncRunMaxWaitMs(): number {
  const raw = process.env.APIFY_SYNC_RUN_MAX_WAIT_MS?.trim();
  const parsed = raw ? Number(raw) : 90_000;
  if (!Number.isFinite(parsed)) return 90_000;
  return Math.min(300_000, Math.max(5_000, Math.floor(parsed)));
}

function normalizeDatasetItems(items: unknown[]): ApifyNewsItem[] {
  return items.filter(
    (item): item is ApifyNewsItem =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
}

async function listNewsItemsFromDataset(
  client: ApifyClient,
  datasetId: string,
  limit: number,
): Promise<ApifyNewsItem[]> {
  const page = await client.dataset(datasetId).listItems({
    limit,
    clean: true,
  });
  return normalizeDatasetItems(page.items ?? []);
}

/**
 * Runs the news actor via the official Apify client, waits up to {@link waitSecs}, then reads the
 * default dataset (partial rows OK if the run is still active or timed out).
 */
async function runNewsActorAndReadDataset(
  client: ApifyClient,
  actorId: string,
  input: Record<string, unknown>,
  limit: number,
  opts: { waitSecs: number; runTimeoutSecs: number },
): Promise<ApifyNewsItem[]> {
  const run = await client.actor(actorId).call(input, {
    waitSecs: opts.waitSecs,
    timeout: opts.runTimeoutSecs,
  });

  const datasetId = run.defaultDatasetId;
  if (!datasetId) return [];

  return listNewsItemsFromDataset(client, datasetId, limit);
}

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

function parseInputJson(raw: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch (error) {
    throw new Error(
      `APIFY_NEWS_INPUT_JSON is not valid JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("APIFY_NEWS_INPUT_JSON must be a JSON object.");
  }

  return parsed as Record<string, unknown>;
}

function buildActorInput(limit: number): Record<string, unknown> {
  const override = process.env.APIFY_NEWS_INPUT_JSON?.trim();
  if (override) {
    return {
      ...parseInputJson(override),
      maxItems: limit,
    };
  }

  return {
    query:
      process.env.APIFY_NEWS_QUERY?.trim() ||
      "India crude oil OR RBI OR wheat export OR inflation OR shipping disruption",
    maxItems: limit,
    gl: process.env.APIFY_NEWS_GL?.trim() || "IN",
    hl: process.env.APIFY_NEWS_HL?.trim() || "en-IN",
    fetchArticleDetails: false,
  };
}

function apifyCredentialsPresent(): boolean {
  return Boolean(apifyToken() && apifyActorId());
}

/** True when the app may call Apify from request paths (feed / detail). */
export function isApifyNewsConfigured(): boolean {
  if (process.env.DISABLE_APIFY_NEWS_FEED === "1") return false;
  return apifyCredentialsPresent();
}

/** True when Apify token + actor exist (used by the daily sync job even if the live feed is disabled). */
export function isApifySyncAvailable(): boolean {
  return apifyCredentialsPresent();
}

const fetchLiveApifyNewsCached = unstable_cache(
  async (limit: number) => {
    const token = apifyToken();
    const actorId = apifyActorId();
    if (!token || !actorId) return [];

    const client = new ApifyClient({ token });
    const input = buildActorInput(limit);
    return runNewsActorAndReadDataset(client, actorId, input, limit, {
      waitSecs: 95,
      runTimeoutSecs: 300,
    });
  },
  ["apify-live-news"],
  { revalidate: revalidateSeconds() },
);

export async function fetchApifyNewsItems(
  limit = newsLimit(),
  options?: { cache?: RequestCache; forSync?: boolean },
): Promise<ApifyNewsItem[]> {
  const forSync = Boolean(options?.forSync);
  if (!forSync && !isApifyNewsConfigured()) return [];
  if (forSync && !apifyCredentialsPresent()) return [];

  const token = apifyToken();
  const actorId = apifyActorId();
  if (!token || !actorId) return [];

  if (forSync) {
    const client = new ApifyClient({ token });
    const input = buildActorInput(limit);
    const waitSecs = Math.min(
      300,
      Math.max(1, Math.ceil(syncRunMaxWaitMs() / 1000)),
    );
    return runNewsActorAndReadDataset(client, actorId, input, limit, {
      waitSecs,
      runTimeoutSecs: 300,
    });
  }

  if (options?.cache === "no-store") {
    const client = new ApifyClient({ token });
    const input = buildActorInput(limit);
    return runNewsActorAndReadDataset(client, actorId, input, limit, {
      waitSecs: 95,
      runTimeoutSecs: 300,
    });
  }

  return fetchLiveApifyNewsCached(limit);
}
