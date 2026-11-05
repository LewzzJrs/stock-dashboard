"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type WatchlistState = {
  symbols: string[];
  hydrated: boolean;
  toggle: (symbol: string) => void;
  remove: (symbol: string) => void;
  markHydrated: () => void;
};

export const useWatchlist = create<WatchlistState>()(
  persist(
    (set, get) => ({
      symbols: [],
      hydrated: false,
      toggle: (symbol) => {
        const current = get().symbols;
        set({
          symbols: current.includes(symbol)
            ? current.filter((item) => item !== symbol)
            : [...current, symbol],
        });
      },
      remove: (symbol) =>
        set({ symbols: get().symbols.filter((item) => item !== symbol) }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "stock-dashboard.watchlist",
      partialize: (state) => ({ symbols: state.symbols }),
      onRehydrateStorage: () => (state) => state?.markHydrated(),
    },
  ),
);
