import type { ImpactEvent } from "@/lib/domain";
import type { ApifyNewsItem } from "./apify-client";
import {
  mapApifyNewsItemToSignal,
  mergeApifyNewsSignals,
} from "./apify-news-signals";

export function mapApifyNewsItemToImpactEvent(
  item: ApifyNewsItem,
  retrievedAt = new Date().toISOString(),
): ImpactEvent | null {
  const signal = mapApifyNewsItemToSignal(item, retrievedAt);
  if (!signal) return null;
  return mergeApifyNewsSignals([signal])[0] ?? null;
}
