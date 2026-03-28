import type { ConfidenceLevel } from "@/lib/domain";

const confidenceLabels: Record<ConfidenceLevel, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
  insufficient: "Insufficient evidence",
};

/** Short text shown next to category labels (Guidance, Facts, …) so level is not color-only. */
const shortLevel: Record<ConfidenceLevel, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
  insufficient: "Unclear",
};

const styles: Record<ConfidenceLevel, string> = {
  high: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  medium:
    "bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100",
  low: "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
  insufficient:
    "bg-rose-100 text-rose-950 dark:bg-rose-950 dark:text-rose-100",
};

type Props = {
  level: ConfidenceLevel;
  label?: string;
};

export function ConfidenceBadge({ level, label }: Props) {
  const full = confidenceLabels[level];
  const content = label ? (
    <>
      <span>{label}</span>
      <span className="mx-1 opacity-50" aria-hidden="true">
        ·
      </span>
      <span className="font-normal">{shortLevel[level]}</span>
    </>
  ) : (
    full
  );

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[level]}`}
    >
      {content}
    </span>
  );
}
