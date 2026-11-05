"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const STARTING_CASH = 100_000;

export type Trade = {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  shares: number;
  price: number;
  at: string;
};

export type Position = {
  symbol: string;
  shares: number;
  /** Total paid for the shares still held, used for the average cost. */
  cost: number;
};

export type TradeResult = { ok: true } | { ok: false; reason: string };

type PortfolioState = {
  cash: number;
  positions: Position[];
  trades: Trade[];
  hydrated: boolean;
  buy: (symbol: string, shares: number, price: number) => TradeResult;
  sell: (symbol: string, shares: number, price: number) => TradeResult;
  reset: () => void;
  markHydrated: () => void;
};

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const usePortfolio = create<PortfolioState>()(
  persist(
    (set, get) => ({
      cash: STARTING_CASH,
      positions: [],
      trades: [],
      hydrated: false,

      buy: (symbol, shares, price) => {
        if (!Number.isInteger(shares) || shares < 1) {
          return { ok: false, reason: "Enter a whole number of shares, at least 1." };
        }
        if (price <= 0) {
          return { ok: false, reason: "No live price for this symbol yet, so the order cannot be priced." };
        }
        const total = shares * price;
        const { cash, positions, trades } = get();
        if (total > cash) {
          return {
            ok: false,
            reason: `That costs $${total.toFixed(2)} and you hold $${cash.toFixed(2)} in cash.`,
          };
        }

        const held = positions.find((position) => position.symbol === symbol);
        set({
          cash: cash - total,
          positions: held
            ? positions.map((position) =>
                position.symbol === symbol
                  ? { ...position, shares: position.shares + shares, cost: position.cost + total }
                  : position,
              )
            : [...positions, { symbol, shares, cost: total }],
          trades: [
            { id: newId(), symbol, side: "buy", shares, price, at: new Date().toISOString() },
            ...trades,
          ],
        });
        return { ok: true };
      },

      sell: (symbol, shares, price) => {
        if (!Number.isInteger(shares) || shares < 1) {
          return { ok: false, reason: "Enter a whole number of shares, at least 1." };
        }
        if (price <= 0) {
          return { ok: false, reason: "No live price for this symbol yet, so the order cannot be priced." };
        }
        const { cash, positions, trades } = get();
        const held = positions.find((position) => position.symbol === symbol);
        if (!held || held.shares < shares) {
          return {
            ok: false,
            reason: `You hold ${held?.shares ?? 0} ${symbol}, so you cannot sell ${shares}.`,
          };
        }

        // Average cost: the sold slice carries its share of what the lot cost.
        const soldCost = (held.cost / held.shares) * shares;
        const remaining = held.shares - shares;
        set({
          cash: cash + shares * price,
          positions:
            remaining === 0
              ? positions.filter((position) => position.symbol !== symbol)
              : positions.map((position) =>
                  position.symbol === symbol
                    ? { ...position, shares: remaining, cost: position.cost - soldCost }
                    : position,
                ),
          trades: [
            { id: newId(), symbol, side: "sell", shares, price, at: new Date().toISOString() },
            ...trades,
          ],
        });
        return { ok: true };
      },

      reset: () => set({ cash: STARTING_CASH, positions: [], trades: [] }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "stock-dashboard.portfolio",
      partialize: (state) => ({
        cash: state.cash,
        positions: state.positions,
        trades: state.trades,
      }),
      onRehydrateStorage: () => (state) => state?.markHydrated(),
    },
  ),
);
