import type { EventCategory, Persona } from "@/lib/domain";

export const FEED_CATEGORY_VALUES: (EventCategory | "all")[] = [
  "all",
  "energy_fuel",
  "food_supply_chain",
  "economic_policy",
];

export const FEED_PERSONA_VALUES: (Persona | "all")[] = [
  "all",
  "commuter",
  "student",
  "small_business_owner",
  "farmer",
  "importer",
];

export function parseFeedCategory(value: string | undefined): EventCategory | "all" {
  if (!value) return "all";
  return FEED_CATEGORY_VALUES.includes(value as EventCategory | "all")
    ? (value as EventCategory | "all")
    : "all";
}

export function parseFeedPersona(value: string | undefined): Persona | "all" {
  if (!value) return "all";
  return FEED_PERSONA_VALUES.includes(value as Persona | "all")
    ? (value as Persona | "all")
    : "all";
}

export function parseFeedRegion(value: string | undefined): string {
  return typeof value === "string" ? value.toLowerCase() : "";
}
