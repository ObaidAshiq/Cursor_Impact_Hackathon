import Link from "next/link";
import type { EventCategory, Persona } from "@/lib/domain";

const categories: { value: EventCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "energy_fuel", label: "Energy & fuel" },
  { value: "food_supply_chain", label: "Food & supply" },
  { value: "economic_policy", label: "Economy & policy" },
];

const personas: { value: Persona | "all"; label: string }[] = [
  { value: "all", label: "All personas" },
  { value: "commuter", label: "Commuter" },
  { value: "student", label: "Student" },
  { value: "small_business_owner", label: "Small business" },
  { value: "farmer", label: "Farmer" },
  { value: "importer", label: "Importer" },
];

const regions: { value: string; label: string }[] = [
  { value: "", label: "All regions" },
  { value: "mumbai", label: "Mumbai" },
  { value: "delhi", label: "Delhi" },
  { value: "bengaluru", label: "Bengaluru" },
];

type Props = {
  category: EventCategory | "all";
  persona: Persona | "all";
  region: string;
};

function buildQuery(next: Partial<Props>): string {
  const category = next.category ?? "all";
  const persona = next.persona ?? "all";
  const region = next.region ?? "";
  const p = new URLSearchParams();
  if (category !== "all") p.set("category", category);
  if (persona !== "all") p.set("persona", persona);
  if (region) p.set("region", region);
  const s = p.toString();
  return s ? `?${s}` : "";
}

function homeHref(next: Partial<Props>): string {
  const q = buildQuery({
    category: next.category,
    persona: next.persona,
    region: next.region,
  });
  return q ? `/${q}` : "/";
}

export function FeedFilters({ category, persona, region }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Category
        </p>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link
              key={c.value}
              href={homeHref({ category: c.value, persona, region })}
              className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${
                category === c.value
                  ? "bg-zinc-900 text-white ring-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:ring-zinc-100"
                  : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-300 dark:ring-zinc-700 dark:hover:bg-zinc-900"
              }`}
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Persona
        </p>
        <div className="flex flex-wrap gap-2">
          {personas.map((p) => (
            <Link
              key={p.value}
              href={homeHref({ category, persona: p.value, region })}
              className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${
                persona === p.value
                  ? "bg-zinc-900 text-white ring-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:ring-zinc-100"
                  : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-300 dark:ring-zinc-700 dark:hover:bg-zinc-900"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Region
        </p>
        <div className="flex flex-wrap gap-2">
          {regions.map((r) => (
            <Link
              key={r.value || "all"}
              href={homeHref({ category, persona, region: r.value })}
              className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${
                region === r.value
                  ? "bg-zinc-900 text-white ring-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:ring-zinc-100"
                  : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-300 dark:ring-zinc-700 dark:hover:bg-zinc-900"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
