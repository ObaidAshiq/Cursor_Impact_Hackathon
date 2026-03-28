import { UserNeedCard } from "@/components/events/UserNeedCard";
import { FeedFilters } from "@/components/events/FeedFilters";
import { AmbientMesh } from "@/components/layout/AmbientMesh";
import { listUserNeedsForFeed } from "@/lib/events-feed";
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

  const { needs, apifyError, liveFetchedAt, eiaError, geminiError } =
    await listUserNeedsForFeed({
      category,
      persona,
      region,
    });

  const listQuery = new URLSearchParams();
  if (category !== "all") listQuery.set("category", category);
  if (persona !== "all") listQuery.set("persona", persona);
  if (region) listQuery.set("region", region);
  const listQueryString = listQuery.toString();

  return (
    <div className="flex flex-col gap-12">
      <section className="relative overflow-hidden rounded-4xl border border-zinc-200/80 bg-zinc-50/50 px-5 py-9 sm:px-8 sm:py-11 dark:border-zinc-800/80 dark:bg-zinc-950/50">
        <AmbientMesh />
        <div className="relative z-10 flex flex-col gap-5">
          <p className="hero-fade text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
            Live feed
          </p>
          <h1 className="hero-fade hero-fade-delay-1 text-balance text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            What people like you may need to act on
          </h1>
          <p className="hero-fade hero-fade-delay-2 max-w-2xl text-pretty text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            We turn live signals from{" "}
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              Apify
            </span>
            , a{" "}
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              U.S. EIA
            </span>
            {" "}snapshot when{" "}
            <code className="rounded-md bg-zinc-200/80 px-1.5 py-0.5 font-mono text-[11px] text-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-200">
              EIA_API_KEY
            </code>{" "}
            is set, and curated examples into persona-first need cards with urgency,
            actions, and local context.
          </p>
          {liveFetchedAt ? (
            <p className="hero-fade hero-fade-delay-2 text-xs text-zinc-500 dark:text-zinc-500">
              Live snapshot: {new Date(liveFetchedAt).toLocaleString()}
            </p>
          ) : null}
          {apifyError ? (
            <p
              className="hero-fade hero-fade-delay-3 rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 backdrop-blur-sm dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-100"
              role="status"
            >
              News feed unavailable ({apifyError}). Curated items still show
              below.
            </p>
          ) : null}
          {eiaError ? (
            <p
              className="hero-fade hero-fade-delay-3 rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 backdrop-blur-sm dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-100"
              role="status"
            >
              U.S. EIA petroleum snapshot unavailable ({eiaError}). Check
              EIA_API_KEY and network.
            </p>
          ) : null}
          {geminiError ? (
            <p
              className="hero-fade hero-fade-delay-3 rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 backdrop-blur-sm dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-100"
              role="status"
            >
              AI feedback unavailable for feed cards ({geminiError}). Event
              pages still try to generate AI feedback first.
            </p>
          ) : null}
        </div>
      </section>

      <FeedFilters category={category} persona={persona} region={region} />

      {needs.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No user needs match these filters. Try another persona or broaden the category.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {needs.map((need, i) => (
            <li key={need.id}>
              <UserNeedCard
                need={need}
                query={listQueryString}
                enterIndex={i}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
