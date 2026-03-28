import { EventCard } from "@/components/events/EventCard";
import { FeedFilters } from "@/components/events/FeedFilters";
import { listEventsForFeed } from "@/lib/events-feed";
import type { EventCategory, Persona } from "@/lib/domain";

const categoryValues: (EventCategory | "all")[] = [
  "all",
  "energy_fuel",
  "food_supply_chain",
  "economic_policy",
];

const personaValues: (Persona | "all")[] = [
  "all",
  "commuter",
  "student",
  "small_business_owner",
  "farmer",
  "importer",
];

function parseCategory(value: string | undefined): EventCategory | "all" {
  if (!value) return "all";
  return categoryValues.includes(value as EventCategory | "all")
    ? (value as EventCategory | "all")
    : "all";
}

function parsePersona(value: string | undefined): Persona | "all" {
  if (!value) return "all";
  return personaValues.includes(value as Persona | "all")
    ? (value as Persona | "all")
    : "all";
}

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const category = parseCategory(
    typeof sp.category === "string" ? sp.category : undefined,
  );
  const persona = parsePersona(
    typeof sp.persona === "string" ? sp.persona : undefined,
  );
  const region =
    typeof sp.region === "string" ? sp.region.toLowerCase() : "";

  const { events, apifyError, liveFetchedAt, eiaError, geminiError } =
    await listEventsForFeed({
      category,
      persona,
    });

  const listQuery = new URLSearchParams();
  if (category !== "all") listQuery.set("category", category);
  if (persona !== "all") listQuery.set("persona", persona);
  if (region) listQuery.set("region", region);
  const listQueryString = listQuery.toString();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Events that may affect you
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          The feed merges news from{" "}
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            Supabase
          </span>{" "}
          when configured (filled by the daily Apify sync job), otherwise a
          direct{" "}
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            Apify
          </span>{" "}
          fetch, plus a{" "}
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            U.S. EIA
          </span>{" "}
          Brent spot snapshot when{" "}
          <code className="rounded bg-zinc-200 px-1 text-xs dark:bg-zinc-800">
            EIA_API_KEY
          </code>{" "}
          is set, and curated India-focused examples.
        </p>
        {liveFetchedAt ? (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
            Live snapshot: {new Date(liveFetchedAt).toLocaleString()}
          </p>
        ) : null}
        {apifyError ? (
          <p
            className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
            role="status"
          >
            News feed unavailable ({apifyError}). Curated items still show
            below.
          </p>
        ) : null}
        {eiaError ? (
          <p
            className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
            role="status"
          >
            U.S. EIA petroleum snapshot unavailable ({eiaError}). Check
            EIA_API_KEY and network.
          </p>
        ) : null}
        {geminiError ? (
          <p
            className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
            role="status"
          >
            AI feedback unavailable for feed cards ({geminiError}). Event pages
            still try to generate AI feedback first.
          </p>
        ) : null}
      </div>

      <FeedFilters category={category} persona={persona} region={region} />

      {events.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No events match these filters. Try &quot;All&quot; or another persona.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {events.map((event) => (
            <li key={event.slug}>
              <EventCard event={event} query={listQueryString} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
