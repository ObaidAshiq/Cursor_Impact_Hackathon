import { NextRequest, NextResponse } from "next/server";
import { runApifyNewsSync } from "@/lib/news-repository";
import { isApifySyncAvailable } from "@/lib/sources/apify-client";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorize(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}

function handleSync(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured (SUPABASE_URL / SERVICE_ROLE_KEY)." },
      { status: 503 },
    );
  }

  if (!isApifySyncAvailable()) {
    return NextResponse.json(
      { error: "Apify is not configured (APIFY_API_TOKEN / actor)." },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "1";

  return runApifyNewsSync({ force }).then((result) => {
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    if (result.skipped) {
      return NextResponse.json({
        skipped: true,
        reason: result.reason,
        lastRunAt: result.lastRunAt,
      });
    }
    return NextResponse.json({
      skipped: false,
      upserted: result.upserted,
      lastRunAt: result.lastRunAt,
    });
  });
}

export function GET(request: NextRequest) {
  return handleSync(request);
}

export function POST(request: NextRequest) {
  return handleSync(request);
}
