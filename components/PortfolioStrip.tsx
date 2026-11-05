"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import type { Quote } from "@/lib/massive";
import type { Position } from "@/stores/portfolio";
import { useSeries } from "@/hooks/useSeries";
import { direction, formatMoney, formatPercent, formatPrice, formatShares } from "@/lib/format";
import { Sparkline } from "@/components/Sparkline";
import { SymbolMark } from "@/components/SymbolMark";

/**
 * Each sparkline is its own series request, and the free plan allows five calls
 * a minute. Prices cost two of them however long the list is, and the main
 * chart one, so two cards can carry a sparkline.
 */
const SPARKLINE_CARDS = 2;

export function PortfolioStrip({
  positions,
  quotes,
  ready,
}: {
  positions: Position[];
  quotes: Map<string, Quote>;
  ready: boolean;
}) {
  const rail = useRef<HTMLUListElement>(null);
  const [more, setMore] = useState(false);

  // The arrow only exists when there is something past the right edge, so it is
  // never a button that does nothing.
  const measure = useCallback(() => {
    const node = rail.current;
    if (!node) return;
    setMore(node.scrollLeft + node.clientWidth < node.scrollWidth - 1);
  }, []);

  useEffect(() => {
    measure();
    const node = rail.current;
    if (!node) return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [measure, positions.length]);

  return (
    <section aria-labelledby="portfolio-strip-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="portfolio-strip-heading" className="text-lg font-semibold text-ink">
          My portfolio
        </h2>
        <Link
          href="/portfolio"
          className="text-sm text-muted underline decoration-control underline-offset-4 hover:text-ink hover:decoration-accent"
        >
          Place an order
        </Link>
      </div>

      {/* The rail clips its own cards, but Chrome still lets their width reach the
          document and give the whole page a horizontal scrollbar. Clipping here
          stops that, which is why the arrow sits inside the panel rather than
          straddling its edge. */}
      <div className="relative mt-3 overflow-hidden">
        <div className="rounded-sm border border-line bg-surface px-6 py-5">
          {!ready ? (
            <p className="text-sm text-muted">
              Reading your account from this browser
              <span aria-hidden="true">…</span>
            </p>
          ) : positions.length === 0 ? (
            <p className="text-sm text-muted">
              You hold nothing yet. Buy something with play money on the{" "}
              <Link
                href="/portfolio"
                className="text-ink underline decoration-control underline-offset-4 hover:decoration-accent"
              >
                Portfolio page
              </Link>{" "}
              and each holding gets a card here.
            </p>
          ) : (
            <ul
              ref={rail}
              onScroll={measure}
              tabIndex={0}
              aria-label="Your holdings, scrolls sideways"
              // The arrow button is the affordance, so the native bar would be a second
              // one for the same thing; tabIndex keeps the rail reachable by keyboard.
              className="flex snap-x gap-6 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {positions.map((position, i) => (
                <PositionCard
                  key={position.symbol}
                  position={position}
                  quote={quotes.get(position.symbol)}
                  withSparkline={i < SPARKLINE_CARDS}
                  divided={i > 0}
                />
              ))}
            </ul>
          )}
        </div>

        {more ? (
          <button
            type="button"
            aria-label="Show more holdings"
            onClick={() => rail.current?.scrollBy({ left: 240, behavior: "smooth" })}
            className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-control bg-raised text-ink hover:border-accent hover:text-accent"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </section>
  );
}

function PositionCard({
  position,
  quote,
  withSparkline,
  divided,
}: {
  position: Position;
  quote: Quote | undefined;
  withSparkline: boolean;
  divided: boolean;
}) {
  const { data } = useSeries(withSparkline ? position.symbol : null, "1m");
  const closes = data?.ok ? data.data.map((candle) => candle.close) : [];

  const value = quote ? position.shares * quote.close : null;
  const ret = value === null ? null : ((value - position.cost) / position.cost) * 100;
  const way = ret === null ? 0 : direction(ret);

  return (
    <li
      className={`w-60 shrink-0 snap-start ${divided ? "border-l border-line pl-6" : ""}`}
    >
      <div className="flex items-center gap-2.5">
        <SymbolMark symbol={position.symbol} size="md" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-semibold text-ink">
            {quote?.name ?? position.symbol}
          </span>
          <span className="block tabular-nums text-[11px] text-muted">{position.symbol}</span>
        </span>
        {closes.length > 1 ? (
          <Sparkline
            values={closes}
            rising={closes[closes.length - 1] >= closes[0]}
            className="h-7 w-16 shrink-0"
          />
        ) : null}
      </div>

      <dl className="mt-4 space-y-2.5 text-[13px]">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted">Total value</dt>
          <dd className="text-sm font-semibold text-ink">
            {value === null ? "–" : formatMoney(value)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted">Total return</dt>
          <dd
            className={`tabular-nums text-sm font-medium ${
              ret === null ? "text-ink" : way === 1 ? "text-up" : way === -1 ? "text-down" : "text-muted"
            }`}
          >
            {ret === null ? (
              "–"
            ) : (
              <>
                {formatPercent(ret)}
                <span aria-hidden="true">{way === 1 ? " ↑" : way === -1 ? " ↓" : ""}</span>
                <span className="sr-only">{way === 1 ? " up" : way === -1 ? " down" : ""}</span>
              </>
            )}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted">Shares</dt>
          <dd className="tabular-nums text-sm text-muted">
            {formatShares(position.shares)} @ {formatPrice(position.cost / position.shares)}
          </dd>
        </div>
      </dl>
    </li>
  );
}
