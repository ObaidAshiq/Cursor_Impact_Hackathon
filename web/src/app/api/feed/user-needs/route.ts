import { NextResponse } from "next/server";
import { FEED_PAGE_MAX, FEED_PAGE_SIZE } from "@/lib/feed-constants";
import { listUserNeedsForFeedPage } from "@/lib/events-feed";
import {
  parseFeedCategory,
  parseFeedPersona,
  parseFeedRegion,
} from "@/lib/feed-search-params";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = parseFeedCategory(searchParams.get("category") ?? undefined);
  const persona = parseFeedPersona(searchParams.get("persona") ?? undefined);
  const region = parseFeedRegion(searchParams.get("region") ?? undefined);
  const offsetRaw = searchParams.get("offset");
  const limitRaw = searchParams.get("limit");
  const offset = offsetRaw ? Number.parseInt(offsetRaw, 10) : 0;
  const limit = limitRaw ? Number.parseInt(limitRaw, 10) : FEED_PAGE_SIZE;
  if (!Number.isFinite(offset) || !Number.isFinite(limit)) {
    return NextResponse.json({ error: "Invalid offset or limit" }, { status: 400 });
  }

  const result = await listUserNeedsForFeedPage(
    { category, persona, region: region || undefined },
    { offset, limit: Math.min(limit, FEED_PAGE_MAX) },
  );

  return NextResponse.json({
    needs: result.needs,
    total: result.total,
    hasMore: result.hasMore,
  });
}
