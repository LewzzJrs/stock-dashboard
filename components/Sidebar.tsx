"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartCandlestick, House, Star, Wallet } from "lucide-react";
import { AccountCard } from "@/components/AccountCard";

const NAV = [
  { href: "/", label: "Dashboard", Icon: House },
  { href: "/markets", label: "Markets", Icon: ChartCandlestick },
  { href: "/watchlist", label: "Watchlist", Icon: Star },
  { href: "/portfolio", label: "Portfolio", Icon: Wallet },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-6 border-r border-line bg-surface px-4 pt-6 lg:flex">
      <Link href="/" className="flex items-center justify-center gap-2.5">
        <span
          aria-hidden="true"
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink"
        >
          <ChartCandlestick size={15} />
        </span>
        <span className="text-base font-semibold tracking-tight text-ink">Stock dashboard</span>
      </Link>

      <AccountCard />

      <nav aria-label="Main" className="flex flex-col gap-1">
        {NAV.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-xs px-3 text-sm ${
                active
                  ? "bg-raised font-medium text-ink"
                  : "text-muted hover:bg-raised hover:text-ink"
              }`}
            >
              <Icon
                size={18}
                aria-hidden="true"
                className={active ? "text-accent" : undefined}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <p className="mt-auto pb-6 text-xs leading-relaxed text-muted">
        Play money, real closing prices. Your account and watchlist stay in this browser.
      </p>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-line bg-surface px-2 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      {NAV.map(({ href, label, Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-xs px-2 ${
              active ? "text-accent" : "text-muted"
            }`}
          >
            <Icon size={20} aria-hidden="true" />
            <span className="text-[11px]">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
