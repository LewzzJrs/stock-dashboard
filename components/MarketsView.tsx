"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { bySymbol, useQuotes } from "@/hooks/useQuotes";
import { useStoresReady } from "@/hooks/useStoresReady";
import { UNIVERSE_SYMBOLS } from "@/lib/universe";
import type { Fetched, SearchHit } from "@/lib/massive";
import { Header } from "@/components/Header";
import { QuoteTable, type SortKey } from "@/components/QuoteTable";
import { EmptyPanel, Loading, StateNotice } from "@/components/StateNotice";
import { WatchButton } from "@/components/WatchButton";

function useLookup(term: string) {
  return useQuery({
    queryKey: ["search", term],
    enabled: term.length > 0,
    staleTime: 3_600_000,
    queryFn: async (): Promise<Fetched<SearchHit[]>> => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
      if (!response.ok) {
        return {
          ok: false,
          kind: "failed",
          detail: `The search route answered ${response.status}.`,
        };
      }
      return (await response.json()) as Fetched<SearchHit[]>;
    },
  });
}

export function MarketsView() {
  const params = useSearchParams();
  const ready = useStoresReady();
  const [filter, setFilter] = useState(params.get("q") ?? "");
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({
    key: "percentChange",
    desc: true,
  });

  const { data, isLoading } = useQuotes(UNIVERSE_SYMBOLS);
  const quotes = useMemo(() => (data?.ok ? data.data : []), [data]);
  const term = filter.trim();

  const matches = useMemo(() => {
    const needle = term.toLowerCase();
    const found = needle
      ? quotes.filter(
          (quote) =>
            quote.symbol.toLowerCase().includes(needle) ||
            quote.name.toLowerCase().includes(needle),
        )
      : quotes;

    return [...found].sort((a, b) => {
      const direction = sort.desc ? -1 : 1;
      if (sort.key === "symbol") return a.symbol.localeCompare(b.symbol) * direction;
      return (a[sort.key] - b[sort.key]) * direction;
    });
  }, [quotes, term, sort]);

  // Only reach the search endpoint when the fixed list cannot answer, so a
  // plain filter costs no API calls.
  const lookupTerm = term.length > 0 && matches.length === 0 ? term : "";
  const lookup = useLookup(lookupTerm);
  const listed = bySymbol(quotes);

  const toggleSort = (key: SortKey) =>
    setSort((current) =>
      current.key === key ? { key, desc: !current.desc } : { key, desc: key !== "symbol" },
    );

  return (
    <>
      <Header title="Markets" asOf={listed.get("SPY")?.date ?? null} />

      <section
        aria-labelledby="list-heading"
        className="rounded-sm border border-line bg-surface px-5 py-4"
      >
        <h2 id="list-heading" className="text-lg font-semibold text-ink">
Twenty widely held US names
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Massive has no “largest companies” endpoint on the free plan, so this list is written
          into the code rather than ordered by size. One call carries the whole market, so its
          length costs nothing. Filtering it is local; a term it cannot match is sent to the
          symbol lookup instead.
        </p>

        <div className="mt-4 flex items-center gap-2">
          <label htmlFor="market-filter" className="text-xs text-muted">
            Filter
          </label>
          <input
            id="market-filter"
            type="search"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="NVDA, or Apple"
            className="min-h-11 w-full max-w-xs rounded-full border border-control bg-bg px-4 tabular-nums text-sm text-ink placeholder:text-muted"
          />
        </div>

        <div className="mt-4">
          {isLoading ? <Loading what="quotes for the list" /> : null}
          {data && !data.ok ? <StateNotice failure={data} what="the market list" /> : null}
          {matches.length > 0 ? (
            <QuoteTable
              quotes={matches}
              caption="Quotes for the symbols on this site, with the change on the day"
              storesReady={ready}
              sort={sort}
              onSort={toggleSort}
            />
          ) : null}
        </div>
      </section>

      {lookupTerm ? (
        <section
          aria-labelledby="lookup-heading"
          className="rounded-sm border border-line bg-surface px-5 py-4"
        >
          <h2 id="lookup-heading" className="text-lg font-semibold text-ink">
            Symbols beyond the list
          </h2>
          <p className="mt-1 text-sm text-muted">
            Nothing on this page matches “{lookupTerm}”, so Massive was asked instead. Watch a
            result to pull its closing price into your watchlist.
          </p>
          <div className="mt-4">
            {lookup.isLoading ? <Loading what={`matches for “${lookupTerm}”`} /> : null}
            {lookup.data && !lookup.data.ok ? (
              <StateNotice failure={lookup.data} what={`matches for “${lookupTerm}”`} />
            ) : null}
            {lookup.data?.ok ? (
              <ul className="divide-y divide-line border-y border-line">
                {lookup.data.data.map((hit) => (
                  <li key={`${hit.symbol}-${hit.exchange}`} className="flex items-center gap-3 py-2">
                    <span className="w-20 shrink-0 tabular-nums text-base text-ink">{hit.symbol}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-ink">{hit.name}</span>
                    <span className="hidden tabular-nums text-xs text-muted sm:block">
                      {hit.exchange}
                    </span>
                    <WatchButton symbol={hit.symbol} ready={ready} />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      ) : null}

      {!isLoading && quotes.length > 0 && matches.length === 0 && !lookupTerm ? (
        <EmptyPanel title="Nothing matches that filter">
          Clear the filter to see the whole list again.
        </EmptyPanel>
      ) : null}
    </>
  );
}
