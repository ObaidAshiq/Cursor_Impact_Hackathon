"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import type { Persona } from "@/lib/domain";

const STORAGE_PERSONA = "impact-intel-persona";
const STORAGE_REGION = "impact-intel-region";

const personas: { value: Persona; label: string }[] = [
  { value: "commuter", label: "Commuter" },
  { value: "student", label: "Student" },
  { value: "small_business_owner", label: "Small business owner" },
  { value: "farmer", label: "Farmer" },
  { value: "importer", label: "Importer" },
];

const regions: { value: string; label: string }[] = [
  { value: "mumbai", label: "Mumbai" },
  { value: "delhi", label: "Delhi" },
  { value: "bengaluru", label: "Bengaluru" },
];

export function ProfileForm() {
  const [persona, setPersona] = useState<Persona>("commuter");
  const [region, setRegion] = useState("mumbai");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    startTransition(() => {
      try {
        const p = localStorage.getItem(STORAGE_PERSONA) as Persona | null;
        const r = localStorage.getItem(STORAGE_REGION);
        if (p && personas.some((x) => x.value === p)) setPersona(p);
        if (r) setRegion(r);
      } catch {
        /* ignore */
      }
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_PERSONA, persona);
      localStorage.setItem(STORAGE_REGION, region);
    } catch {
      /* ignore */
    }
  }, [persona, region, ready]);

  const feedHref = (() => {
    const q = new URLSearchParams();
    q.set("persona", persona);
    q.set("region", region);
    return `/?${q.toString()}`;
  })();

  return (
    <div className="flex max-w-md flex-col gap-6">
      <div>
        <label
          htmlFor="persona"
          className="text-sm font-medium text-zinc-900 dark:text-zinc-50"
        >
          Persona
        </label>
        <select
          id="persona"
          value={persona}
          onChange={(e) => setPersona(e.target.value as Persona)}
          className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          {personas.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="region"
          className="text-sm font-medium text-zinc-900 dark:text-zinc-50"
        >
          City / region
        </label>
        <select
          id="region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          {regions.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Saved only in this browser. We use it to tailor local notes and
          actions—not to track you.
        </p>
      </div>

      <Link
        href={feedHref}
        className="inline-flex w-fit items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        View feed for my profile
      </Link>
    </div>
  );
}
