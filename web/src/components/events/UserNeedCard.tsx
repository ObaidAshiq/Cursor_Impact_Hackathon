import Link from "next/link";
import type { UserNeedCard as UserNeedCardModel } from "@/lib/domain";
import { ConfidenceBadge } from "@/components/events/ConfidenceBadge";
import { urgencyLabels, personaLabels } from "@/lib/user-needs";

const provenanceLabel: Record<NonNullable<UserNeedCardModel["provenance"]>, string> = {
  apify: "Live source",
  reliefweb: "Live source",
  eia: "Live data",
  curated: "Curated",
};

type Props = {
  need: UserNeedCardModel;
  query?: string;
  enterIndex?: number;
};

export function UserNeedCard({ need, query = "", enterIndex }: Props) {
  const params = new URLSearchParams(query);
  params.set("persona", need.persona);
  const nextQuery = params.toString();
  const href = nextQuery
    ? `/event/${need.sourceEventSlug}?${nextQuery}`
    : `/event/${need.sourceEventSlug}`;

  return (
    <article
      className="event-card-enter rounded-2xl border border-zinc-200/90 bg-white/90 p-5 shadow-sm backdrop-blur-sm transition duration-300 ease-out hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800/90 dark:bg-zinc-950/80 dark:hover:border-zinc-600/90"
      style={
        enterIndex != null
          ? { animationDelay: `${enterIndex * 48}ms` }
          : undefined
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
          {personaLabels[need.persona]}
        </span>
        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
          {urgencyLabels[need.urgency]}
        </span>
        <ConfidenceBadge level={need.confidence} label="Guidance" />
        {need.provenance ? (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {provenanceLabel[need.provenance]}
          </span>
        ) : null}
      </div>

      <h2 className="mt-3 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        <Link href={href} className="hover:underline">
          {need.title}
        </Link>
      </h2>

      <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {need.summary}
      </p>

      <p className="mt-3 rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300">
        {need.recommendedActions[0]}
      </p>

      {need.regionBlurb ? (
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          Local note: {need.regionBlurb}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
        <span>Signal: {need.sourceEventTitle}</span>
        <span>Updated {new Date(need.updatedAt).toLocaleString()}</span>
      </div>
    </article>
  );
}
