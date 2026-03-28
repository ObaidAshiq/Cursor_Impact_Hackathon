import Link from "next/link";
import { auth } from "@/auth";
import { signInWithGoogle, signOutAction } from "@/app/auth/actions";

const nav = [
  { href: "/", label: "Feed" },
  { href: "/profile", label: "Profile" },
  { href: "/method", label: "Method" },
] as const;

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          Impact Intelligence
        </Link>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <nav className="flex flex-wrap items-center gap-3">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
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
            {session?.user ? (
              <>
                <span className="max-w-40 truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {session.user.name ?? session.user.email ?? "Signed in"}
                </span>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="rounded-md border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-900"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <form action={signInWithGoogle}>
                <button
                  type="submit"
                  className="rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
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
