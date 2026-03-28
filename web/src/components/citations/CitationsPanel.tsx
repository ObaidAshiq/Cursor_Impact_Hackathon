import type { Citation } from "@/lib/domain";

type Props = {
  citations: Citation[];
};

const kindLabel: Record<Citation["kind"], string> = {
  official: "Official",
  multilateral: "Multilateral",
  media: "Media",
  data: "Data",
};

export function CitationsPanel({ citations }: Props) {
  if (citations.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No citations linked for this view.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {citations.map((c) => (
        <li
          key={c.id}
          className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/40"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-white px-1.5 py-0.5 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:text-zinc-300 dark:ring-zinc-700">
              {kindLabel[c.kind]}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Retrieved {new Date(c.retrievedAt).toLocaleDateString()}
            </span>
          </div>
          <a
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-50"
          >
            {c.title}
          </a>
          <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
            {c.publisher}
          </p>
        </li>
      ))}
    </ul>
  );
}
