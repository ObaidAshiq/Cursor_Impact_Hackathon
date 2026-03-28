"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EventCategory, Persona, UserNeedCard as UserNeedCardModel } from "@/lib/domain";
import { UserNeedCard } from "@/components/events/UserNeedCard";
import { FEED_PAGE_SIZE } from "@/lib/feed-constants";

function FeedCardSkeleton({
  subtle,
  decorative = true,
}: {
  subtle?: boolean;
  /** When false, skeleton is announced (e.g. in-feed loading slide). */
  decorative?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-zinc-200/80 bg-zinc-100/60 p-5 dark:border-zinc-800/80 dark:bg-zinc-900/50 ${
        subtle ? "opacity-70" : ""
      } feed-load-skeleton`}
      aria-hidden={decorative ? true : undefined}
    >
      <div className="flex flex-wrap gap-2">
        <div className="h-6 w-24 rounded-full bg-zinc-300/80 dark:bg-zinc-700/80" />
        <div className="h-6 w-20 rounded-full bg-zinc-300/80 dark:bg-zinc-700/80" />
      </div>
      <div className="mt-4 h-5 w-4/5 max-w-md rounded-md bg-zinc-300/80 dark:bg-zinc-700/80" />
      <div className="mt-3 h-3 w-full max-w-lg rounded bg-zinc-300/60 dark:bg-zinc-700/60" />
      <div className="mt-2 h-3 w-11/12 max-w-lg rounded bg-zinc-300/60 dark:bg-zinc-700/60" />
      <div className="mt-4 h-12 w-full rounded-xl bg-zinc-300/50 dark:bg-zinc-700/50" />
    </div>
  );
}

type Props = {
  initialNeeds: UserNeedCardModel[];
  initialHasMore: boolean;
  listQueryString: string;
  category: EventCategory | "all";
  persona: Persona | "all";
  region: string;
  pageSize?: number;
};

export function NeedFeedInfinite({
  initialNeeds,
  initialHasMore,
  listQueryString,
  category,
  persona,
  region,
  pageSize = FEED_PAGE_SIZE,
}: Props) {
  const [needs, setNeeds] = useState(initialNeeds);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const userHasInteractedRef = useRef(false);
  const needsRef = useRef(needs);
  const hasMoreRef = useRef(hasMore);
  const loadingRef = useRef(false);
  const fetchAbortRef = useRef<AbortController | null>(null);

  needsRef.current = needs;
  hasMoreRef.current = hasMore;

  useEffect(() => {
    fetchAbortRef.current?.abort();
    fetchAbortRef.current = null;
    loadingRef.current = false;
    setLoading(false);
    setNeeds(initialNeeds);
    setHasMore(initialHasMore);
    setError(null);
    userHasInteractedRef.current = false;
  }, [initialNeeds, initialHasMore]);

  useEffect(() => () => fetchAbortRef.current?.abort(), []);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;
    fetchAbortRef.current?.abort();
    const ac = new AbortController();
    fetchAbortRef.current = ac;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set("offset", String(needsRef.current.length));
    params.set("limit", String(pageSize));
    if (category !== "all") params.set("category", category);
    if (persona !== "all") params.set("persona", persona);
    if (region) params.set("region", region);
    try {
      const res = await fetch(`/api/feed/user-needs?${params.toString()}`, {
        signal: ac.signal,
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `Request failed (${res.status})`);
      }
      const data = (await res.json()) as {
        needs: UserNeedCardModel[];
        hasMore: boolean;
      };
      setNeeds((prev) => {
        const seen = new Set(prev.map((need) => need.id));
        const next = data.needs.filter((need) => !seen.has(need.id));
        return [...prev, ...next];
      });
      setHasMore(data.hasMore);
      hasMoreRef.current = data.hasMore;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Could not load more.");
    } finally {
      if (fetchAbortRef.current === ac) fetchAbortRef.current = null;
      loadingRef.current = false;
      setLoading(false);
    }
  }, [pageSize, category, persona, region]);

  const isSentinelNearViewport = useCallback(() => {
    const el = sentinelRef.current;
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return rect.top <= window.innerHeight + 160;
  }, []);

  const maybeLoadMore = useCallback(() => {
    if (!userHasInteractedRef.current) return;
    if (!hasMoreRef.current || loadingRef.current) return;
    if (!isSentinelNearViewport()) return;
    void loadMore();
  }, [isSentinelNearViewport, loadMore]);

  useEffect(() => {
    const onUserIntent = () => {
      userHasInteractedRef.current = true;
      maybeLoadMore();
    };

    window.addEventListener("scroll", onUserIntent, { passive: true });
    window.addEventListener("wheel", onUserIntent, { passive: true });
    window.addEventListener("touchmove", onUserIntent, { passive: true });
    window.addEventListener("keydown", onUserIntent);

    return () => {
      window.removeEventListener("scroll", onUserIntent);
      window.removeEventListener("wheel", onUserIntent);
      window.removeEventListener("touchmove", onUserIntent);
      window.removeEventListener("keydown", onUserIntent);
    };
  }, [maybeLoadMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMoreRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          maybeLoadMore();
        }
      },
      {
        root: null,
        rootMargin: "0px 0px 160px 0px",
        threshold: 0,
      },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, maybeLoadMore, needs.length]);

  useEffect(() => {
    if (!loading) {
      requestAnimationFrame(() => {
        maybeLoadMore();
      });
    }
  }, [loading, maybeLoadMore, needs.length]);

  return (
    <div className="flex flex-col gap-3">
      <ul
        className="flex flex-col gap-4"
        aria-busy={loading}
        aria-label="User need cards"
      >
        {needs.map((need) => (
          <li key={need.id}>
            <UserNeedCard
              need={need}
              query={listQueryString}
              quickEnter
            />
          </li>
        ))}
      </ul>
      {loading ? (
        <div
          className="space-y-3"
          role="status"
          aria-live="polite"
        >
          {/* <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Loading more...
          </p> */}
          <FeedCardSkeleton decorative={false} />
        </div>
      ) : null}
      {hasMore ? (
        <div
          ref={sentinelRef}
          className="h-12"
          aria-hidden
        />
      ) : null}
      {error ? (
        <p
          className="rounded-xl border border-red-200/90 bg-red-50/90 px-4 py-3 text-sm text-red-950 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100"
          role="alert"
        >
          {error}{" "}
          <button
            type="button"
            className="font-medium underline decoration-red-800/40 underline-offset-2 hover:decoration-red-800 dark:decoration-red-200/40 dark:hover:decoration-red-200"
            onClick={() => void loadMore()}
          >
            Try again
          </button>
        </p>
      ) : null}
    </div>
  );
}
