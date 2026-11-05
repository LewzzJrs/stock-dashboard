"use client";

import { Star } from "lucide-react";
import { useWatchlist } from "@/stores/watchlist";

export function WatchButton({ symbol, ready }: { symbol: string; ready: boolean }) {
  const symbols = useWatchlist((state) => state.symbols);
  const toggle = useWatchlist((state) => state.toggle);
  const watching = symbols.includes(symbol);

  return (
    <button
      type="button"
      disabled={!ready}
      aria-pressed={watching}
      onClick={() => toggle(symbol)}
      title={watching ? `Stop watching ${symbol}` : `Watch ${symbol}`}
      className={`flex size-11 items-center justify-center rounded-full border ${
        watching
          ? "border-accent text-accent"
          : "border-transparent text-muted hover:border-control hover:text-ink"
      } disabled:text-line`}
    >
      <Star size={18} aria-hidden="true" fill={watching ? "currentColor" : "none"} />
      <span className="sr-only">
        {ready
          ? watching
            ? `Stop watching ${symbol}`
            : `Watch ${symbol}`
          : `Reading your watchlist`}
      </span>
    </button>
  );
}
