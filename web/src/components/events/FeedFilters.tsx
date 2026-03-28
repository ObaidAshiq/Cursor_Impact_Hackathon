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
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
          Category
        </p>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link
              key={c.value}
              href={homeHref({ category: c.value, persona, region })}
              className={`filter-chip rounded-full px-3.5 py-1.5 text-xs font-medium ${
                category === c.value ? "filter-chip--active" : ""
              }`}
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
          Persona
        </p>
        <div className="flex flex-wrap gap-2">
          {personas.map((p) => (
            <Link
              key={p.value}
              href={homeHref({ category, persona: p.value, region })}
              className={`filter-chip rounded-full px-3.5 py-1.5 text-xs font-medium ${
                persona === p.value ? "filter-chip--active" : ""
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
          Region
        </p>
        <div className="flex flex-wrap gap-2">
          {regions.map((r) => (
            <Link
              key={r.value || "all"}
              href={homeHref({ category, persona, region: r.value })}
              className={`filter-chip rounded-full px-3.5 py-1.5 text-xs font-medium ${
                region === r.value ? "filter-chip--active" : ""
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
