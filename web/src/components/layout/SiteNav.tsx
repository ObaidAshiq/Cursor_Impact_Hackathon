"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ImpactLogo from "../../../public/icons/ImpactLogo";

const nav = [
  { href: "/profile", label: "Profile" },
  { href: "/method", label: "Method" },
] as const;

export function SiteBrandLink() {
  const pathname = usePathname();
  return (
    <Link
      href="/"
      aria-current={pathname === "/" || pathname === "" ? "page" : undefined}
      className="inline-flex items-center gap-1.5 text-sm font-semibold tracking-tight text-zinc-900 transition-opacity hover:opacity-80 dark:text-zinc-50"
    >
      <ImpactLogo className="h-5 w-5" />
      Impact Intelligence
    </Link>
  );
}

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap items-center gap-1 sm:gap-2"
      aria-label="Site"
    >
      {nav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={pathname === item.href ? "page" : undefined}
          className="relative px-2 py-1 text-zinc-600 transition-colors after:absolute after:inset-x-2 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-zinc-900 after:transition-transform after:duration-300 hover:text-zinc-900 hover:after:scale-x-100 dark:text-zinc-400 dark:after:bg-zinc-100 dark:hover:text-zinc-100"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
