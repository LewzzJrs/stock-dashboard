"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Quote } from "@/lib/massive";
import { useSeries } from "@/hooks/useSeries";
import { direction, formatDay, formatMoney, formatPercent, formatPrice } from "@/lib/format";
import { RANGES, type RangeKey } from "@/lib/universe";
import { SymbolMark } from "@/components/SymbolMark";
import { Loading, StateNotice } from "@/components/StateNotice";

export function PriceChart({
  symbol,
  options,
  onSelect,
  quote,
}: {
  symbol: string | null;
  options: string[];
  onSelect: (symbol: string) => void;
  quote?: Quote;
}) {
  const [range, setRange] = useState<RangeKey>("6m");
  const { data, isLoading } = useSeries(symbol, range);
  const label = RANGES.find((entry) => entry.key === range)?.label ?? "6M";

  const points = useMemo(
    () => (data?.ok ? data.data.map((row) => ({ ...row, label: formatDay(row.date) })) : []),
    [data],
  );

  const rising = points.length > 1 && points[points.length - 1].close >= points[0].close;
  const tone = rising ? "var(--up)" : "var(--down)";
  const way = direction(quote?.percentChange ?? 0);
  const up = way === 1;
  const down = way === -1;

  return (
    <section
      className="rounded-sm border border-line bg-surface px-6 py-5"
      aria-labelledby="chart-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <SymbolMark symbol={symbol ?? "--"} size="lg" />
          <div className="min-w-0">
            <h2 id="chart-heading" className="truncate text-lg font-semibold text-ink">
              {quote?.name ?? (symbol ? symbol : "Pick a symbol to chart")}
            </h2>
            <p className="tabular-nums text-xs text-muted">{symbol}</p>
          </div>
        </div>

        {quote ? (
          <div className="flex items-start gap-3">
            <p
              className={`mt-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                up ? "bg-up/15 text-up" : down ? "bg-down/15 text-down" : "text-muted"
              }`}
            >
              <span aria-hidden="true">{up ? "▲ " : down ? "▼ " : ""}</span>
              <span className="sr-only">{up ? "up " : down ? "down " : ""}</span>
              {formatPercent(quote.percentChange)}
            </p>
            <div className="text-right">
              <p className="text-3xl font-semibold text-ink">
                {formatMoney(quote.close)}
              </p>
              <p className="text-xs text-muted">Close of {formatDay(quote.date)}</p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Chart range" className="flex flex-wrap gap-1.5">
          {RANGES.map((entry) => {
            const active = entry.key === range;
            return (
              <button
                key={entry.key}
                type="button"
                aria-pressed={active}
                onClick={() => setRange(entry.key)}
                className={`min-h-9 rounded-full px-4 text-xs font-medium ${
                  active
                    ? "bg-accent text-accent-ink"
                    : "border border-control text-muted hover:border-accent hover:text-accent"
                }`}
              >
                {entry.label}
              </button>
            );
          })}
        </div>

        <label htmlFor="chart-symbol" className="sr-only">
          Symbol to chart
        </label>
        <select
          id="chart-symbol"
          value={symbol ?? ""}
          onChange={(event) => onSelect(event.target.value)}
          className="ml-auto min-h-9 rounded-full border border-control bg-bg px-3 tabular-nums text-xs text-ink"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <h3 className="sr-only">
        {symbol ? `Where has ${symbol} closed over the last ${label}?` : "No symbol is charted yet"}
      </h3>

      <div className="mt-4 h-72">
        {isLoading ? <Loading what={`${symbol} price history`} /> : null}
        {data && !data.ok ? (
          <StateNotice failure={data} what={`${symbol} price history`} />
        ) : null}
        {points.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="price-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={tone} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={tone} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--line)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "var(--line)" }}
                minTickGap={40}
              />
              <YAxis
                domain={["auto", "auto"]}
                width={60}
                tickFormatter={(value: number) => formatPrice(value)}
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ stroke: "var(--control)" }}
                contentStyle={{
                  background: "var(--raised)",
                  border: "1px solid var(--control)",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
                labelStyle={{ color: "var(--muted)" }}
                itemStyle={{ color: "var(--ink)" }}
                formatter={(value) => [formatPrice(Number(value ?? 0)), "Close"]}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={tone}
                strokeWidth={2}
                fill="url(#price-fill)"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : null}
      </div>
    </section>
  );
}
