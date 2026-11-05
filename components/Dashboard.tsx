"use client";

import { useMemo, useState } from "react";
import { bySymbol, useQuotes } from "@/hooks/useQuotes";
import { useStoresReady } from "@/hooks/useStoresReady";
import { formatPrice } from "@/lib/format";
import { TAPE_SYMBOLS, UNIVERSE, UNIVERSE_SYMBOLS } from "@/lib/universe";
import { usePortfolio } from "@/stores/portfolio";
import { useWatchlist } from "@/stores/watchlist";
import { AccountCard } from "@/components/AccountCard";
import { Change } from "@/components/Change";
import { Header } from "@/components/Header";
import { PortfolioStrip } from "@/components/PortfolioStrip";
import { PriceChart } from "@/components/PriceChart";
import { SymbolMark } from "@/components/SymbolMark";
import { WatchlistPanel } from "@/components/WatchlistPanel";
import { EmptyPanel, Loading, StateNotice } from "@/components/StateNotice";

const MOVER_COUNT = 3;

export function Dashboard() {
  const ready = useStoresReady();
  const positions = usePortfolio((state) => state.positions);
  const watched = useWatchlist((state) => state.symbols);
  const [charted, setCharted] = useState("SPY");

  // One request covers the fixed list plus anything held or starred, so those
  // still get priced without a second call.
  const symbols = useMemo(
    () => [...new Set([...UNIVERSE_SYMBOLS, ...positions.map((p) => p.symbol), ...watched])],
    [positions, watched],
  );
  const { data, isLoading } = useQuotes(symbols);

  const quotes = data?.ok ? data.data : [];
  const index = bySymbol(quotes);
  const universeQuotes = quotes.filter((quote) => UNIVERSE_SYMBOLS.includes(quote.symbol));

  // Split by sign first. Taking the bottom of the list would file a symbol that
  // rose under "Down" on a day when everything rose.
  const ranked = [...universeQuotes].sort((a, b) => b.percentChange - a.percentChange);
  const gainers = ranked.filter((quote) => quote.percentChange > 0).slice(0, MOVER_COUNT);
  const losers = ranked
    .filter((quote) => quote.percentChange < 0)
    .slice(-MOVER_COUNT)
    .reverse();

  const spy = index.get("SPY");

  return (
    <>
      <Header title="Dashboard" asOf={spy?.date ?? null} />

      {/* The sidebar holds this card at desktop width, where the sidebar exists. */}
      <div className="lg:hidden">
        <AccountCard />
      </div>

      {data && !data.ok ? <StateNotice failure={data} what="closing prices" /> : null}
      {isLoading ? <Loading what="quotes for the whole list" /> : null}

      <PortfolioStrip positions={positions} quotes={index} ready={ready} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <PriceChart
          symbol={charted}
          options={symbols}
          onSelect={setCharted}
          quote={index.get(charted)}
        />
        <WatchlistPanel
          symbols={watched}
          quotes={index}
          ready={ready}
          onSelect={setCharted}
        />
      </div>

      {quotes.length > 0 ? (
        <section aria-labelledby="tape-heading">
          <h2 id="tape-heading" className="text-lg font-semibold text-ink">
            Where the broad market sits
          </h2>
          <p className="mt-1 text-sm text-muted">
            Four funds that track the big indices. These are funds, not the indices themselves,
            so they follow their index closely but are not the same instrument.
          </p>
          <ul className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {TAPE_SYMBOLS.map((symbol) => {
              const quote = index.get(symbol);
              const entry = UNIVERSE.find((item) => item.symbol === symbol);
              return (
                <li
                  key={symbol}
                  className="rounded-sm border border-line bg-surface px-5 py-4"
                >
                  <div className="flex items-center gap-2.5">
                    <SymbolMark symbol={symbol} size="md" />
                    <span className="min-w-0">
                      <span className="block tabular-nums text-sm font-medium text-ink">
                        {symbol}
                      </span>
                      <span className="block truncate text-xs text-muted">{entry?.label}</span>
                    </span>
                  </div>
                  {quote ? (
                    <div className="mt-3 flex items-baseline justify-between gap-3">
                      <p className="tabular-nums text-2xl font-medium text-ink">
                        {formatPrice(quote.close)}
                      </p>
                      <Change percent={quote.percentChange} delta={quote.change} size="sm" />
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-muted">no quote</p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section
        aria-labelledby="movers-heading"
        className="rounded-sm border border-line bg-surface px-5 py-4"
      >
        <h2 id="movers-heading" className="text-lg font-semibold text-ink">
          What moved most today
        </h2>
        <p className="mt-1 text-sm text-muted">
          Biggest moves inside the list on this site, not across the whole market.
        </p>
        {universeQuotes.length === 0 ? (
          <div className="mt-4">
            <EmptyPanel title="No quotes to rank yet">
              Once the list loads, the three largest moves up and down appear here.
            </EmptyPanel>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              { label: "Up", rows: gainers, none: "Nothing is up." },
              { label: "Down", rows: losers, none: "Nothing is down." },
            ].map((group) => (
              <div key={group.label}>
                <h3 className="text-xs text-muted">
                  {group.label}
                </h3>
                {group.rows.length === 0 ? (
                  <p className="mt-2 text-sm text-muted">{group.none}</p>
                ) : null}
                <ul className="mt-2">
                  {group.rows.map((quote) => (
                    <li key={quote.symbol} className="flex items-center gap-3 py-2">
                      <SymbolMark symbol={quote.symbol} size="sm" />
                      <span className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => setCharted(quote.symbol)}
                          className="block text-sm font-medium text-ink underline decoration-control underline-offset-4 hover:decoration-accent"
                        >
                          {quote.symbol}
                          <span className="sr-only"> , chart this symbol</span>
                        </button>
                        <span className="block truncate text-xs text-muted">{quote.name}</span>
                      </span>
                      <Change percent={quote.percentChange} size="sm" showDelta={false} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
