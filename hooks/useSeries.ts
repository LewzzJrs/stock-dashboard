"use client";

import { useQuery } from "@tanstack/react-query";
import type { Candle, Fetched } from "@/lib/massive";

export function useSeries(symbol: string | null, range: string) {
  return useQuery({
    queryKey: ["series", symbol, range],
    enabled: Boolean(symbol),
    staleTime: 900_000,
    queryFn: async (): Promise<Fetched<Candle[]>> => {
      const response = await fetch(`/api/series?symbol=${symbol}&range=${range}`);
      if (!response.ok) {
        return {
          ok: false,
          kind: "failed",
          detail: `The series route answered ${response.status}.`,
        };
      }
      return (await response.json()) as Fetched<Candle[]>;
    },
  });
}
