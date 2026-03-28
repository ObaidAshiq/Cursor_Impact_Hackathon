import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Method",
  description:
    "How Impact Intelligence separates facts from inference and applies confidence labels.",
};

export default function MethodPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Method</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          We combine official and high-trust data with careful, labeled
          inference. The goal is practical guidance without pretending we know
          more than the evidence supports.
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          What we know vs what we infer
        </h2>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          <strong>What we know</strong> is tied to cited sources such as
          regulators, ministries, multilateral data, or established data
          publishers. <strong>What we infer</strong> is downstream reasoning
          about likely effects. Inference is always marked and given its own
          confidence level.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Confidence labels
        </h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
          <li>
            <strong>High</strong>: strong, recent, official or equivalent
            support.
          </li>
          <li>
            <strong>Medium</strong>: credible support, or inference with clear
            mechanisms.
          </li>
          <li>
            <strong>Low</strong>: early signal, thin corroboration, or weak local
            precision.
          </li>
          <li>
            <strong>Insufficient</strong>: not enough to recommend action.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          MVP scope
        </h2>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          The first version focuses on energy and fuel disruptions, food and
          supply chain shocks, and economic or policy changes affecting India.
          Other topics may appear later as the evidence model matures.
        </p>
      </section>
    </div>
  );
}
