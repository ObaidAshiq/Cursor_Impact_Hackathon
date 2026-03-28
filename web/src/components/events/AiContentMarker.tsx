type Props = {
  className?: string;
};

/** Inline label for copy refined or drafted with AI (Gemini). */
const AI_MARKER_DESC =
  "AI-assisted: drafted or refined with Google Gemini. Verify facts using Sources below.";

export function AiContentMarker({ className = "" }: Props) {
  return (
    <span
      role="img"
      aria-label={AI_MARKER_DESC}
      title={AI_MARKER_DESC}
      className={`inline-flex shrink-0 items-center rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100 ${className}`}
    >
      AI
    </span>
  );
}
