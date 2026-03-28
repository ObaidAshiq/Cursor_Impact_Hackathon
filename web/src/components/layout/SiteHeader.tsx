import { auth } from "@/auth";
import { signInWithGoogle, signOutAction } from "@/app/auth/actions";
import { SiteBrandLink, SiteNav } from "@/components/layout/SiteNav";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/70 bg-background/75 backdrop-blur-xl dark:border-zinc-800/70">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <SiteBrandLink />
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <SiteNav />
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
