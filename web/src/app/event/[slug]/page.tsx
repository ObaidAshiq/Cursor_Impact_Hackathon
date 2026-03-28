import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CitationsPanel } from "@/components/citations/CitationsPanel";
import { AiContentMarker } from "@/components/events/AiContentMarker";
import { ConfidenceBadge } from "@/components/events/ConfidenceBadge";
import type { Persona } from "@/lib/domain";
import {
  getStaticEventSlugs,
  getUserNeedBySlugResolved,
} from "@/lib/events-feed";
import { mapImpactEventToUserNeeds, personaLabels, urgencyLabels } from "@/lib/user-needs";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export function generateStaticParams() {
  return getStaticEventSlugs().map((slug) => ({ slug }));
}

function parsePersona(value: string | undefined): Persona | undefined {
  if (
    value &&
    (
      [
        "commuter",
        "student",
        "small_business_owner",
        "farmer",
        "importer",
      ] as const
    ).includes(value as Persona)
  ) {
    return value as Persona;
  }
  return undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await getUserNeedBySlugResolved(slug, {});
  if (!resolved) {
    return { title: "Event" };
  }
  const raw = resolved.need.summary.trim();
  const description =
    raw.length > 155 ? `${raw.slice(0, 155)}…` : raw || undefined;
  return {
    title: resolved.need.title,
    ...(description ? { description } : {}),
  };
}

export default async function EventPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = (await searchParams) ?? {};
  const personaParam = parsePersona(
    typeof sp.persona === "string" ? sp.persona : undefined,
  );
  const regionParam =
    typeof sp.region === "string" ? sp.region.toLowerCase() : undefined;
  const resolved = await getUserNeedBySlugResolved(slug, {
    persona: personaParam,
    region: regionParam,
  });
  if (!resolved) notFound();

  const { event, need } = resolved;
  const personaNeeds = mapImpactEventToUserNeeds(event, {
    persona: "all",
    region: regionParam,
  });

  const backQuery = new URLSearchParams();
  if (typeof sp.category === "string") backQuery.set("category", sp.category);
  backQuery.set("persona", need.persona);
  if (regionParam) backQuery.set("region", regionParam);
  const backHref = backQuery.toString() ? `/?${backQuery.toString()}` : "/";

  return (
    <article className="flex flex-col gap-8">
      <div>
        <Link
          href={backHref}
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Back to feed
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          {need.title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {need.summary}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
            {personaLabels[need.persona]}
          </span>
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
            {urgencyLabels[need.urgency]}
          </span>
          {need.narrativeRefinedWithGemini ? (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
              AI-assisted narrative
            </span>
          ) : null}
          {event.provenance === "apify" ? (
            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-900 dark:bg-orange-950 dark:text-orange-100">
              Live · Apify News
            </span>
          ) : null}
          {event.provenance === "reliefweb" ? (
            <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-900 dark:bg-sky-950 dark:text-sky-100">
              Live · ReliefWeb
            </span>
          ) : null}
          {event.provenance === "eia" ? (
            <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-900 dark:bg-violet-950 dark:text-violet-100">
              Live · U.S. EIA
            </span>
          ) : null}
          <ConfidenceBadge level={need.confidence} label="Guidance" />
          <ConfidenceBadge level={event.factsConfidence} label="Facts" />
          <ConfidenceBadge level={event.inferConfidence} label="Inference" />
        </div>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Based on signal: <span className="font-medium text-zinc-900 dark:text-zinc-100">{event.title}</span>
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Severity {event.severity}/5 · Horizon: {event.horizon} · Updated{" "}
          {new Date(event.updatedAt).toLocaleString()}
        </p>
        {need.aiError ? (
          <p
            className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
            role="status"
          >
            AI feedback is currently unavailable ({need.aiError}). Showing the
            curated or rule-based narrative instead.
          </p>
        ) : null}
      </div>

      {personaNeeds.length > 1 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            View this signal for another audience
          </h2>
          <div className="flex flex-wrap gap-2">
            {personaNeeds.map((item) => {
              const next = new URLSearchParams();
              if (typeof sp.category === "string") next.set("category", sp.category);
              next.set("persona", item.persona);
              if (regionParam) next.set("region", regionParam);
              const href = `/event/${event.slug}?${next.toString()}`;
              const active = item.id === need.id;
              return (
                <Link
                  key={item.id}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    active
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {personaLabels[item.persona]}
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="space-y-2">
        <h2 className="flex flex-wrap items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          <span>Why this matters</span>
          {need.aiRefinedFields?.indiaImpact ? <AiContentMarker /> : null}
        </h2>
        <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
          {need.whyItMatters}
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="flex flex-wrap items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          <span>What you can do next</span>
          {need.aiRefinedFields?.actionsByPersona ? <AiContentMarker /> : null}
        </h2>
        <ul className="list-inside list-decimal space-y-1 text-sm text-zinc-800 dark:text-zinc-200">
          {need.recommendedActions.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="flex flex-wrap items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          <span>Local or city lens</span>
          {need.aiRefinedFields?.localNotes ? <AiContentMarker /> : null}
        </h2>
        {need.regionBlurb ? (
          <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
            {need.regionBlurb}
          </p>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {regionParam
              ? "We do not have a city-specific note for this event yet. The India-level view still applies."
              : "Choose a region on the feed or profile to see a local note when we have one."}
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="flex flex-wrap items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          <span>What we know</span>
          {event.aiRefinedFields?.whatWeKnow ? <AiContentMarker /> : null}
        </h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-zinc-800 dark:text-zinc-200">
          {event.whatWeKnow.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="flex flex-wrap items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          <span>What we infer</span>
          {event.aiRefinedFields?.whatWeInfer ? <AiContentMarker /> : null}
        </h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-zinc-800 dark:text-zinc-200">
          {event.whatWeInfer.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Other affected audiences
        </h2>
        <ul className="flex flex-wrap gap-2">
          {event.mostAffectedPersonas.map((p) => (
            <li
              key={p}
              className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
            >
              {personaLabels[p]}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Underlying India-wide signal
        </h2>
        <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
          {event.indiaImpact}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Sources
        </h2>
        <CitationsPanel citations={event.citations} />
      </section>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        This tool is for general awareness only. It is not financial, legal, or
        emergency advice. Verify urgent matters with official channels.
      </p>
    </article>
  );
}
