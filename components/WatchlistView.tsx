"use client";

import Link from "next/link";
import { useStoresReady } from "@/hooks/useStoresReady";
import { bySymbol, useQuotes } from "@/hooks/useQuotes";
import { useWatchlist } from "@/stores/watchlist";
import { Header } from "@/components/Header";
import { QuoteTable } from "@/components/QuoteTable";
import { EmptyPanel, Loading, StateNotice } from "@/components/StateNotice";

export function WatchlistView() {
  const ready = useStoresReady();
  const symbols = useWatchlist((state) => state.symbols);
  const { data, isLoading } = useQuotes(ready ? symbols : []);

  const quotes = data?.ok ? data.data : [];
  const missing = symbols.filter((symbol) => !bySymbol(quotes).has(symbol));

  return (
    <>
      <Header title="Watchlist" />

      <section
        aria-labelledby="watchlist-heading"
        className="rounded-sm border border-line bg-surface px-5 py-4"
      >
        <h2 id="watchlist-heading" className="text-lg font-semibold text-ink">
          Symbols you follow
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Kept in this browser only. Nothing is sent anywhere, and clearing your site data clears
          this list. Adding symbols costs nothing: one call carries the whole market.
        </p>

        <div className="mt-4">
          {!ready ? <p className="text-sm text-muted">Reading your list from this browser…</p> : null}

          {ready && symbols.length === 0 ? (
            <EmptyPanel title="You are not watching anything yet">
              Press the star beside any symbol on the{" "}
              <Link
                href="/markets"
                className="text-ink underline decoration-control underline-offset-4 hover:decoration-accent"
              >
                Markets page
              </Link>{" "}
              to put it here.
            </EmptyPanel>
          ) : null}

          {ready && symbols.length > 0 && isLoading ? (
            <Loading what={`quotes for ${symbols.join(", ")}`} />
          ) : null}

          {data && !data.ok ? <StateNotice failure={data} what="your watchlist quotes" /> : null}

          {quotes.length > 0 ? (
            <QuoteTable
              quotes={quotes}
              caption="Symbols you follow, with the last price and the change on the day"
              storesReady={ready}
            />
          ) : null}

          {quotes.length > 0 && missing.length > 0 ? (
            <p className="mt-3 text-sm text-muted">
              No quote came back for {missing.join(", ")}. It may not have traded in the last
              session, or Massive may not carry it. Press its star again to drop it.
            </p>
          ) : null}
        </div>
      </section>
    </>
  );
}
