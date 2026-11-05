"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import type { Quote } from "@/lib/massive";
import { formatMoney } from "@/lib/format";
import { Change } from "@/components/Change";
import { SymbolMark } from "@/components/SymbolMark";

export function WatchlistPanel({
  symbols,
  quotes,
  ready,
  onSelect,
}: {
  symbols: string[];
  quotes: Map<string, Quote>;
  ready: boolean;
  onSelect: (symbol: string) => void;
}) {
  return (
    <section
      aria-labelledby="watchlist-panel-heading"
      className="self-start rounded-sm border border-line bg-surface px-6 py-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="watchlist-panel-heading" className="text-lg font-semibold text-ink">
          My watchlist
        </h2>
        <Link
          href="/markets"
          aria-label="Add a symbol from the Markets page"
          title="Add a symbol"
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-control text-muted hover:border-accent hover:text-accent"
        >
          <Plus size={16} aria-hidden="true" />
        </Link>
      </div>

      {!ready ? (
        <p className="mt-4 text-sm text-muted">
          Reading your list from this browser
          <span aria-hidden="true">…</span>
        </p>
      ) : symbols.length === 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Nothing starred yet. Press the star beside any symbol on the{" "}
          <Link
            href="/markets"
            className="text-ink underline decoration-control underline-offset-4 hover:decoration-accent"
          >
            Markets page
          </Link>{" "}
          to put it here.
        </p>
      ) : (
        <ul className="mt-2">
          {symbols.map((symbol) => {
            const quote = quotes.get(symbol);
            return (
              <li key={symbol} className="flex items-center gap-3 py-2.5">
                <SymbolMark symbol={symbol} size="sm" />
                <span className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onSelect(symbol)}
                    className="block tabular-nums text-sm font-medium text-ink underline decoration-control underline-offset-4 hover:decoration-accent"
                  >
                    {symbol}
                    <span className="sr-only"> , chart this symbol</span>
                  </button>
                  <span className="block truncate text-xs text-muted">
                    {quote?.name ?? "No quote"}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block tabular-nums text-sm font-medium text-ink">
                    {quote ? formatMoney(quote.close) : "–"}
                  </span>
                  {quote ? (
                    <Change percent={quote.percentChange} size="sm" showDelta={false} />
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
