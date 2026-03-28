import { seedEvents } from "@/data/seed-events";
import type { EventCategory, ImpactEvent, Persona } from "@/lib/domain";

export function getAllEvents(): ImpactEvent[] {
  return seedEvents;
}

export function getEventBySlug(slug: string): ImpactEvent | undefined {
  return seedEvents.find((e) => e.slug === slug);
}

export function getEventSlugs(): string[] {
  return seedEvents.map((e) => e.slug);
}

export type EventListFilters = {
  category?: EventCategory | "all";
  persona?: Persona | "all";
};

export function listEvents(
  filters: EventListFilters = {},
  pool: readonly ImpactEvent[] = seedEvents,
): ImpactEvent[] {
  const { category = "all", persona = "all" } = filters;
  return pool.filter((e) => {
    if (category !== "all" && e.category !== category) return false;
    if (persona !== "all" && !e.mostAffectedPersonas.includes(persona)) {
      return false;
    }
    return true;
  });
}

export function localBlurbForRegion(
  event: ImpactEvent,
  regionKey: string | undefined,
): string | null {
  if (!regionKey) return null;
  const key = regionKey.trim().toLowerCase();
  return event.localNotes?.[key] ?? null;
}
