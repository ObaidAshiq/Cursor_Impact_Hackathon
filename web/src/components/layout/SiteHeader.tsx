import Link from "next/link";
import { auth } from "@/auth";
import { signInWithGoogle, signOutAction } from "@/app/auth/actions";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const nav = [
  { href: "/", label: "Feed" },
  { href: "/profile", label: "Profile" },
  { href: "/method", label: "Method" },
] as const;

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/70 bg-background/75 backdrop-blur-xl dark:border-zinc-800/70">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-zinc-900 transition-opacity hover:opacity-80 dark:text-zinc-50"
        >
          Impact Intelligence
        </Link>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative px-2 py-1 text-zinc-600 transition-colors after:absolute after:inset-x-2 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-zinc-900 after:transition-transform after:duration-300 hover:text-zinc-900 hover:after:scale-x-100 dark:text-zinc-400 dark:after:bg-zinc-100 dark:hover:text-zinc-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <span
            className="hidden h-4 w-px bg-zinc-200 sm:inline dark:bg-zinc-700"
            aria-hidden
          />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {session?.user ? (
              <>
                <span className="max-w-36 truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {session.user.name ?? session.user.email ?? "Signed in"}
                </span>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="filter-chip rounded-full px-3 py-1.5 text-xs font-medium transition hover:-translate-y-px"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <form action={signInWithGoogle}>
                <button
                  type="submit"
                  className="rounded-full bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-zinc-800 hover:shadow dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                >
                  Sign in with Google
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
