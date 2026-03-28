import Link from "next/link";
import { notFound } from "next/navigation";
import { CitationsPanel } from "@/components/citations/CitationsPanel";
import { AiContentMarker } from "@/components/events/AiContentMarker";
import { ConfidenceBadge } from "@/components/events/ConfidenceBadge";
import type { Persona } from "@/lib/domain";
import {
  getEventBySlugResolved,
  getStaticEventSlugs,
  localBlurbForRegion,
} from "@/lib/events-feed";

const personaLabels: Record<Persona, string> = {
  commuter: "Commuter",
  student: "Student",
  small_business_owner: "Small business owner",
  farmer: "Farmer",
  importer: "Importer",
};

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export function generateStaticParams() {
  return getStaticEventSlugs().map((slug) => ({ slug }));
}

export default async function EventPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = (await searchParams) ?? {};
  const event = await getEventBySlugResolved(slug);
  if (!event) notFound();

  const personaParam =
    typeof sp.persona === "string" ? sp.persona : undefined;
  const regionParam =
    typeof sp.region === "string" ? sp.region.toLowerCase() : undefined;

  const persona =
    personaParam &&
    (
      [
        "commuter",
        "student",
        "small_business_owner",
        "farmer",
        "importer",
      ] as const
    ).includes(personaParam as Persona)
      ? (personaParam as Persona)
      : undefined;

  const local = localBlurbForRegion(event, regionParam);
  const actions =
    persona && event.actionsByPersona[persona]
      ? event.actionsByPersona[persona]
      : undefined;

  return (
    <article className="flex flex-col gap-8">
      <div>
        <Link
          href="/"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Back to feed
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          {event.title}
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Severity {event.severity}/5 · Horizon: {event.horizon} · Updated{" "}
          {new Date(event.updatedAt).toLocaleString()}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
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
          {event.narrativeRefinedWithGemini ? (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
              AI-assisted narrative
            </span>
          ) : null}
          <ConfidenceBadge level={event.factsConfidence} label="Facts" />
          <ConfidenceBadge level={event.inferConfidence} label="Inference" />
        </div>
        {event.aiError ? (
          <p
            className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
            role="status"
          >
            AI feedback is currently unavailable ({event.aiError}). Showing the
            curated or rule-based narrative instead.
          </p>
        ) : null}
      </div>

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
        <h2 className="flex flex-wrap items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          <span>Impact on India</span>
          {event.aiRefinedFields?.indiaImpact ? <AiContentMarker /> : null}
        </h2>
        <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
          {event.indiaImpact}
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="flex flex-wrap items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          <span>Local or city lens</span>
          {event.aiRefinedFields?.localNotes ? <AiContentMarker /> : null}
        </h2>
        {local ? (
          <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
            {local}
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
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Who is most affected
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
        <h2 className="flex flex-wrap items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          <span>What you can do</span>
          {event.aiRefinedFields?.actionsByPersona ? (
            <AiContentMarker />
          ) : null}
        </h2>
        {actions ? (
          <ul className="list-inside list-decimal space-y-1 text-sm text-zinc-800 dark:text-zinc-200">
            {actions.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {persona
              ? "No persona-specific checklist is defined for this event yet."
              : `Add persona and region from your profile or the feed to see tailored steps. Affected personas: ${event.mostAffectedPersonas.map((p) => personaLabels[p]).join(", ")}.`}
          </p>
        )}
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
