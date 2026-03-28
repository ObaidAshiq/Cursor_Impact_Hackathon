type Props = {
  className?: string;
};

/** Inline label for copy refined or drafted with AI (Gemini). */
export function AiContentMarker({ className = "" }: Props) {
  return (
    <span
      title="This text was drafted or refined with AI (Google Gemini). Use Sources to verify facts."
      className={`inline-flex shrink-0 items-center rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100 ${className}`}
    >
      AI
    </span>
  );
}
