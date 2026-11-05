"use client";

import type { Quote } from "@/lib/massive";
import { formatCompact, formatMoney } from "@/lib/format";
import { Change } from "@/components/Change";
import { SymbolMark } from "@/components/SymbolMark";
import { WatchButton } from "@/components/WatchButton";

export type SortKey = "symbol" | "close" | "percentChange";

export function QuoteTable({
  quotes,
  caption,
  storesReady,
  sort,
  onSort,
  onSelect,
  selected,
}: {
  quotes: Quote[];
  caption: string;
  storesReady: boolean;
  sort?: { key: SortKey; desc: boolean };
  onSort?: (key: SortKey) => void;
  onSelect?: (symbol: string) => void;
  selected?: string | null;
}) {
  const head = (key: SortKey, label: string, align: "left" | "right") => {
    const active = sort?.key === key;
    return (
      <th
        scope="col"
        aria-sort={active ? (sort.desc ? "descending" : "ascending") : undefined}
        className={`py-2 font-normal ${align === "right" ? "text-right" : "text-left"}`}
      >
        {onSort ? (
          <button
            type="button"
            onClick={() => onSort(key)}
            className={`min-h-11 px-1 ${active ? "text-accent" : "text-muted hover:text-ink"}`}
          >
            {label}
            <span aria-hidden="true">{active ? (sort.desc ? " ↓" : " ↑") : ""}</span>
          </button>
        ) : (
          <span className="px-1">{label}</span>
        )}
      </th>
    );
  };

  return (
    <div className="overflow-x-auto">
      {/* Name and volume are hidden on small screens, so the minimum width
          steps down with them and the day change stays on screen. */}
      <table className="w-full min-w-[20rem] border-collapse text-left sm:min-w-[30rem] lg:min-w-[38rem]">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line text-xs text-muted">
            {head("symbol", "Symbol", "left")}
            <th scope="col" className="hidden py-2 px-1 font-normal sm:table-cell">
              Name
            </th>
            {head("close", "Last", "right")}
            {head("percentChange", "Day", "right")}
            <th scope="col" className="hidden py-2 px-1 text-right font-normal lg:table-cell">
              Volume
            </th>
            <th scope="col" className="py-2 text-right font-normal">
              <span className="sr-only">Watch</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((quote) => {
            const active = selected === quote.symbol;
            return (
              <tr
                key={quote.symbol}
                className={`border-b border-line last:border-0 ${active ? "bg-raised" : ""}`}
              >
                <th scope="row" className="py-2 px-1 font-normal">
                  <span className="flex items-center gap-2.5">
                    <SymbolMark symbol={quote.symbol} size="sm" />
                    {onSelect ? (
                      <button
                        type="button"
                        onClick={() => onSelect(quote.symbol)}
                        aria-pressed={active}
                        className="min-h-11 tabular-nums text-base text-ink underline decoration-control underline-offset-4 hover:decoration-accent"
                      >
                        {quote.symbol}
                        <span className="sr-only"> , chart this symbol</span>
                      </button>
                    ) : (
                      <span className="tabular-nums text-base text-ink">{quote.symbol}</span>
                    )}
                  </span>
                </th>
                <td className="hidden max-w-[18rem] truncate py-2 px-1 text-sm text-muted sm:table-cell">
                  {quote.name}
                </td>
                <td className="py-3 px-1 text-right text-sm font-medium text-ink">
                  {formatMoney(quote.close)}
                </td>
                <td className="py-2 px-1 text-right">
                  <Change percent={quote.percentChange} delta={quote.change} size="sm" />
                </td>
                <td className="hidden py-2 px-1 text-right tabular-nums text-sm text-muted lg:table-cell">
                  {quote.volume === null ? "–" : formatCompact(quote.volume)}
                </td>
                <td className="py-2 text-right">
                  <div className="flex justify-end">
                    <WatchButton symbol={quote.symbol} ready={storesReady} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
