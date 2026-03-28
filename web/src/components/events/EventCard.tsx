import Link from "next/link";
import type { ImpactEvent } from "@/lib/domain";
import { AiContentMarker } from "@/components/events/AiContentMarker";
import { ConfidenceBadge } from "@/components/events/ConfidenceBadge";

const categoryLabel: Record<ImpactEvent["category"], string> = {
  energy_fuel: "Energy & fuel",
  food_supply_chain: "Food & supply chain",
  economic_policy: "Economy & policy",
};

type Props = {
  event: ImpactEvent;
  query?: string;
};

export function EventCard({ event, query = "" }: Props) {
  const href = query ? `/event/${event.slug}?${query}` : `/event/${event.slug}`;

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-center gap-2">
        {event.provenance === "apify" ? (
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-900 dark:bg-orange-950 dark:text-orange-100">
            Live · Apify News
          </span>
        ) : null}
        {event.provenance === "reliefweb" ? (
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-900 dark:bg-sky-950 dark:text-sky-100">
            Live · ReliefWeb
          </span>
        ) : null}
        {event.provenance === "eia" ? (
          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-900 dark:bg-violet-950 dark:text-violet-100">
            Live · U.S. EIA
          </span>
        ) : null}
        {event.narrativeRefinedWithGemini ? (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
            AI-assisted
          </span>
        ) : null}
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
          {categoryLabel[event.category]}
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Severity {event.severity}/5 · {event.horizon}
        </span>
        <ConfidenceBadge level={event.factsConfidence} label="Facts" />
      </div>
      <h2 className="mt-2 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        <Link href={href} className="hover:underline">
          {event.title}
        </Link>
      </h2>
      <p className="mt-2 flex gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        {event.aiRefinedFields?.indiaImpact ? (
          <AiContentMarker className="mt-0.5 self-start" />
        ) : null}
        <span className="line-clamp-2 min-w-0 leading-relaxed">
          {event.indiaImpact}
        </span>
      </p>
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
        Updated {new Date(event.updatedAt).toLocaleString()}
      </p>
    </article>
  );
}
