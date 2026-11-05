"use client";

import { useRouter } from "next/navigation";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Search } from "lucide-react";
import { formatDay } from "@/lib/format";

export function Header({
  title,
  asOf,
}: {
  title: string;
  /** The trading session the figures on the page close, as YYYY-MM-DD. */
  asOf?: string | null;
}) {
  const router = useRouter();
  const client = useQueryClient();
  const fetching = useIsFetching({ queryKey: ["quotes"] }) > 0;

  return (
    <header className="flex flex-wrap items-center gap-3">
      <h1 className="text-xl font-semibold text-ink">{title}</h1>

      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          const value = new FormData(event.currentTarget).get("q");
          const query = typeof value === "string" ? value.trim() : "";
          router.push(query ? `/markets?q=${encodeURIComponent(query)}` : "/markets");
        }}
        className="order-last w-full sm:order-none sm:ml-6 sm:w-auto sm:min-w-0 sm:flex-1 sm:max-w-md"
      >
        <label htmlFor="symbol-search" className="sr-only">
          Search symbols
        </label>
        {/* The submit control is the magnifier inside the field, so the field's
            left padding has to leave room for it. */}
        <div className="relative">
          <button
            type="submit"
            aria-label="Search symbols"
            className="absolute top-1/2 left-1 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-raised hover:text-ink"
          >
            <Search size={16} aria-hidden="true" />
          </button>
          <input
            id="symbol-search"
            name="q"
            type="search"
            autoComplete="off"
            placeholder="Search for a stock, AAPL"
            className="min-h-11 w-full rounded-full border border-control bg-surface pr-4 pl-11 text-sm text-ink placeholder:text-muted"
          />
        </div>
      </form>

      {asOf ? (
        <p className="text-xs text-muted">
          Closing prices, {formatDay(asOf)}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => client.invalidateQueries({ queryKey: ["quotes"] })}
        disabled={fetching}
        aria-label="Refresh prices"
        title="Refresh prices"
        className="flex size-11 shrink-0 items-center justify-center rounded-full border border-control bg-surface text-muted hover:border-accent hover:text-accent disabled:border-line disabled:text-line"
      >
        <RefreshCw size={17} aria-hidden="true" className={fetching ? "animate-spin" : undefined} />
      </button>
    </header>
  );
}
