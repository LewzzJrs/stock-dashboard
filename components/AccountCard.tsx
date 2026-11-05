"use client";

import { useCachedQuotes } from "@/hooks/useCachedQuotes";
import { useStoresReady } from "@/hooks/useStoresReady";
import { direction, formatMoney, formatPercent } from "@/lib/format";
import { STARTING_CASH, usePortfolio } from "@/stores/portfolio";

/**
 * The card at the top of the sidebar, so the account follows you across pages.
 * It prices positions from quotes the open page has already fetched and never
 * asks for its own, because the free plan allows only five calls a minute.
 */
export function AccountCard() {
  const ready = useStoresReady();
  const cash = usePortfolio((state) => state.cash);
  const positions = usePortfolio((state) => state.positions);
  const quotes = useCachedQuotes();

  const unpriced = positions.filter((position) => !quotes.has(position.symbol)).length;
  const holdings = positions.reduce(
    (total, position) => total + position.shares * (quotes.get(position.symbol)?.close ?? 0),
    0,
  );
  const complete = unpriced === 0;
  const total = cash + holdings;
  const ret = ((total - STARTING_CASH) / STARTING_CASH) * 100;
  const way = direction(ret);

  return (
    <div className="rounded-sm bg-raised px-4 py-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-muted">{complete ? "Total investment" : "Cash"}</p>
        {ready && complete ? (
          <p
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
              way === 1 ? "bg-up/15 text-up" : way === -1 ? "bg-down/15 text-down" : "text-muted"
            }`}
          >
            <span aria-hidden="true">{way === 1 ? "▲ " : way === -1 ? "▼ " : ""}</span>
            <span className="sr-only">{way === 1 ? "up " : way === -1 ? "down " : ""}</span>
            {formatPercent(ret)}
          </p>
        ) : null}
      </div>

      {!ready ? (
        <p className="mt-2 text-sm text-muted">
          Reading it from this browser
          <span aria-hidden="true">…</span>
        </p>
      ) : (
        <>
          <p className="mt-1 text-2xl font-semibold text-ink">
            {formatMoney(complete ? total : cash)}
          </p>
          {complete ? null : (
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              {unpriced} position{unpriced === 1 ? "" : "s"} carry no price on this page, so the
              total is only on the dashboard.
            </p>
          )}
        </>
      )}
    </div>
  );
}
