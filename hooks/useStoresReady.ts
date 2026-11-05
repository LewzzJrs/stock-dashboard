"use client";

import { usePortfolio } from "@/stores/portfolio";
import { useWatchlist } from "@/stores/watchlist";

/**
 * Both stores read from localStorage after mount, so the first client render
 * has to match the server render. Anything that depends on stored state waits
 * for this instead of rendering an empty list it will immediately replace.
 */
export function useStoresReady(): boolean {
  const watchlistReady = useWatchlist((state) => state.hydrated);
  const portfolioReady = usePortfolio((state) => state.hydrated);
  return watchlistReady && portfolioReady;
}
