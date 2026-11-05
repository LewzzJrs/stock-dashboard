"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { bySymbol, useQuotes } from "@/hooks/useQuotes";
import { useStoresReady } from "@/hooks/useStoresReady";
import { formatMoney, formatPrice, formatShares, formatStamp } from "@/lib/format";
import { UNIVERSE_SYMBOLS } from "@/lib/universe";
import { STARTING_CASH, usePortfolio } from "@/stores/portfolio";
import { useWatchlist } from "@/stores/watchlist";
import { Change } from "@/components/Change";
import { Header } from "@/components/Header";
import { EmptyPanel, Loading, StateNotice } from "@/components/StateNotice";

export function PortfolioView() {
  const ready = useStoresReady();
  const { cash, positions, trades, buy, sell, reset } = usePortfolio();
  const watched = useWatchlist((state) => state.symbols);

  const [symbol, setSymbol] = useState("AAPL");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [shares, setShares] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const held = positions.map((position) => position.symbol);
  const tradable = useMemo(
    () => [...new Set([...held, ...watched, ...UNIVERSE_SYMBOLS])],
    [held, watched],
  );

  const { data, isLoading } = useQuotes(ready ? tradable : []);
  const quotes = data?.ok ? data.data : [];
  const index = bySymbol(quotes);

  const price = index.get(symbol)?.close ?? 0;
  const count = Number(shares);
  const estimate = Number.isFinite(count) && count > 0 ? count * price : 0;

  const holdingsValue = positions.reduce(
    (total, position) => total + position.shares * (index.get(position.symbol)?.close ?? 0),
    0,
  );
  const totalValue = cash + holdingsValue;
  const returnPercent = ((totalValue - STARTING_CASH) / STARTING_CASH) * 100;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setDone(null);

    if (!Number.isInteger(count) || count < 1) {
      setError("Enter a whole number of shares, at least 1.");
      return;
    }
    const result = side === "buy" ? buy(symbol, count, price) : sell(symbol, count, price);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    setError(null);
    setDone(
      `${side === "buy" ? "Bought" : "Sold"} ${formatShares(count)} ${symbol} at ${formatPrice(price)}.`,
    );
  }

  return (
    <>
      <Header title="Portfolio" asOf={index.get("SPY")?.date ?? null} />

      <p className="rounded-sm border border-accent bg-raised px-4 py-3 text-sm text-ink">
        Play money. Orders fill at the last closing price Massive reported, with no spread,
        no commission and no partial fills, so results here will not match a real broker. Nothing
        leaves this browser.
      </p>

      {data && !data.ok ? <StateNotice failure={data} what="prices for your account" /> : null}
      {ready && isLoading ? <Loading what="prices for your positions" /> : null}
      {!ready ? <p className="text-sm text-muted">Reading your account from this browser…</p> : null}

      {ready ? (
        <>
          <section aria-labelledby="value-heading" className="rounded-sm border border-line bg-surface px-5 py-4">
            <h2 id="value-heading" className="text-lg font-semibold text-ink">
              What the account is worth
            </h2>
            <dl className="mt-4 grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
              <div className="bg-bg px-4 py-3">
                <dt className="text-xs text-muted">Total</dt>
                <dd className="mt-1 tabular-nums text-2xl text-ink">{formatMoney(totalValue)}</dd>
              </div>
              <div className="bg-bg px-4 py-3">
                <dt className="text-xs text-muted">Cash</dt>
                <dd className="mt-1 tabular-nums text-2xl text-ink">{formatMoney(cash)}</dd>
              </div>
              <div className="bg-bg px-4 py-3">
                <dt className="text-xs text-muted">
                  Positions
                </dt>
                <dd className="mt-1 tabular-nums text-2xl text-ink">{formatMoney(holdingsValue)}</dd>
              </div>
              <div className="bg-bg px-4 py-3">
                <dt className="text-xs text-muted">
                  Since {formatMoney(STARTING_CASH)}
                </dt>
                <dd className="mt-1">
                  <Change percent={returnPercent} delta={totalValue - STARTING_CASH} size="lg" />
                </dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="ticket-heading" className="rounded-sm border border-line bg-surface px-5 py-4">
            <h2 id="ticket-heading" className="text-lg font-semibold text-ink">
              Place an order
            </h2>
            <p className="mt-1 text-sm text-muted">
              Only symbols this site already prices can be traded. To trade something else, star it
              on the{" "}
              <Link
                href="/markets"
                className="text-ink underline decoration-control underline-offset-4 hover:decoration-accent"
              >
                Markets page
              </Link>{" "}
              first.
            </p>

            {/* noValidate keeps the browser's own bubble out of the way, so every
                rejected order is explained in the same inline sentence. */}
            <form noValidate onSubmit={submit} className="mt-4 flex flex-wrap items-end gap-4">
              <div>
                <label
                  htmlFor="order-symbol"
                  className="block text-xs text-muted"
                >
                  Symbol
                </label>
                <select
                  id="order-symbol"
                  value={symbol}
                  onChange={(event) => {
                    setSymbol(event.target.value);
                    setError(null);
                    setDone(null);
                  }}
                  className="mt-1 min-h-11 rounded-xs border border-control bg-bg px-3 tabular-nums text-sm text-ink"
                >
                  {tradable.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <fieldset className="border-0 p-0">
                <legend className="text-xs text-muted">
                  Side
                </legend>
                <div className="mt-1 flex gap-1">
                  {(["buy", "sell"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={side === option}
                      onClick={() => {
                        setSide(option);
                        setError(null);
                        setDone(null);
                      }}
                      className={`min-h-11 rounded-sm border px-4 text-sm font-medium ${
                        side === option
                          ? "border-accent bg-accent text-accent-ink"
                          : "border-control text-muted hover:border-accent hover:text-accent"
                      }`}
                    >
                      {option === "buy" ? "Buy" : "Sell"}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div>
                <label
                  htmlFor="order-shares"
                  className="block text-xs text-muted"
                >
                  Shares
                </label>
                <input
                  id="order-shares"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={shares}
                  onChange={(event) => {
                    setShares(event.target.value);
                    setError(null);
                    setDone(null);
                  }}
                  className="mt-1 min-h-11 w-28 rounded-xs border border-control bg-bg px-3 tabular-nums text-sm text-ink"
                />
              </div>

              <div>
                <p className="text-xs text-muted">Estimate</p>
                <p className="mt-1 min-h-11 tabular-nums text-lg text-ink">
                  {price > 0 ? formatMoney(estimate) : "no price yet"}
                </p>
              </div>

              <button
                type="submit"
                className="min-h-11 rounded-sm bg-accent px-5 text-sm font-medium text-accent-ink hover:bg-accent-hover"
              >
                {side === "buy" ? "Buy" : "Sell"} {symbol}
              </button>
            </form>

            {price > 0 ? (
              <p className="mt-3 tabular-nums text-xs text-muted">
                Last price {formatPrice(price)} per share.
              </p>
            ) : null}

            {error ? (
              <p role="alert" className="mt-3 text-sm text-down">
                <span aria-hidden="true">✕ </span>
                {error}
              </p>
            ) : null}
            {done ? (
              <p role="status" className="mt-3 text-sm text-up">
                <span aria-hidden="true">✓ </span>
                {done}
              </p>
            ) : null}
          </section>

          <section aria-labelledby="positions-heading" className="rounded-sm border border-line bg-surface px-5 py-4">
            <h2 id="positions-heading" className="text-lg font-semibold text-ink">
              What you hold
            </h2>
            <div className="mt-4">
              {positions.length === 0 ? (
                <EmptyPanel title="No positions yet">
                  Use the order ticket above. You start with {formatMoney(STARTING_CASH)} in play
                  money.
                </EmptyPanel>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[36rem] border-collapse text-left">
                    <caption className="sr-only">
                      Your positions, with average cost, market value and unrealised profit
                    </caption>
                    <thead>
                      <tr className="border-b border-line text-xs text-muted">
                        <th scope="col" className="py-2 pr-4 font-normal">Symbol</th>
                        <th scope="col" className="py-2 pr-4 text-right font-normal">Shares</th>
                        <th scope="col" className="py-2 pr-4 text-right font-normal">Avg cost</th>
                        <th scope="col" className="py-2 pr-4 text-right font-normal">Last</th>
                        <th scope="col" className="py-2 pr-4 text-right font-normal">Value</th>
                        <th scope="col" className="py-2 text-right font-normal">Unrealised</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map((position) => {
                        const last = index.get(position.symbol)?.close ?? 0;
                        const value = position.shares * last;
                        const profit = value - position.cost;
                        const profitPercent = position.cost > 0 ? (profit / position.cost) * 100 : 0;
                        return (
                          <tr key={position.symbol} className="border-b border-line last:border-0">
                            <th scope="row" className="py-2 pr-4 tabular-nums text-base font-normal text-ink">
                              {position.symbol}
                            </th>
                            <td className="py-2 pr-4 text-right tabular-nums text-sm text-ink">
                              {formatShares(position.shares)}
                            </td>
                            <td className="py-2 pr-4 text-right tabular-nums text-sm text-muted">
                              {formatPrice(position.cost / position.shares)}
                            </td>
                            <td className="py-2 pr-4 text-right tabular-nums text-sm text-ink">
                              {last > 0 ? formatPrice(last) : "–"}
                            </td>
                            <td className="py-2 pr-4 text-right tabular-nums text-sm text-ink">
                              {last > 0 ? formatMoney(value) : "–"}
                            </td>
                            <td className="py-2 text-right">
                              {last > 0 ? (
                                <Change percent={profitPercent} delta={profit} size="sm" />
                              ) : (
                                <span className="text-sm text-muted">no price</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section aria-labelledby="history-heading" className="rounded-sm border border-line bg-surface px-5 py-4">
            <h2 id="history-heading" className="text-lg font-semibold text-ink">
              Every order you placed
            </h2>
            <div className="mt-4">
              {trades.length === 0 ? (
                <EmptyPanel title="No orders yet">
                  Orders appear here as soon as you place one, newest first.
                </EmptyPanel>
              ) : (
                <ol className="divide-y divide-line border-y border-line">
                  {trades.slice(0, 50).map((trade) => (
                    <li key={trade.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2">
                      <span
                        className={`w-10 text-xs font-medium ${
                          trade.side === "buy" ? "text-up" : "text-down"
                        }`}
                      >
                        {trade.side}
                      </span>
                      <span className="tabular-nums text-sm text-ink">{trade.symbol}</span>
                      <span className="tabular-nums text-sm text-muted">
                        {formatShares(trade.shares)} @ {formatPrice(trade.price)}
                      </span>
                      <span className="tabular-nums text-sm text-ink">
                        {formatMoney(trade.shares * trade.price)}
                      </span>
                      <span className="ml-auto tabular-nums text-xs text-muted">
                        {formatStamp(trade.at)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>

          <section aria-labelledby="reset-heading" className="border-t border-line pt-6">
            <h2 id="reset-heading" className="text-lg font-semibold text-ink">
              Start over
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              Puts the cash back to {formatMoney(STARTING_CASH)} and clears every position and
              order. This cannot be undone.
            </p>
            {confirmReset ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    setConfirmReset(false);
                    setError(null);
                    setDone("Account reset.");
                  }}
                  className="min-h-11 rounded-sm bg-down px-4 text-sm font-medium text-bg hover:opacity-90"
                >
                  Yes, erase everything
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="min-h-11 rounded-sm border border-control px-4 text-sm font-medium text-ink hover:border-accent hover:text-accent"
                >
                  Keep my account
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="mt-3 min-h-11 rounded-sm border border-control px-4 text-sm font-medium text-ink hover:border-down hover:text-down"
              >
                Reset the account
              </button>
            )}
          </section>
        </>
      ) : null}
    </>
  );
}
