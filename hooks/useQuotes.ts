"use client";

import { useQuery } from "@tanstack/react-query";
import type { Fetched, Quote } from "@/lib/massive";

async function fetchQuotes(symbols: string[]): Promise<Fetched<Quote[]>> {
  if (symbols.length === 0) return { ok: true, data: [] };
  const response = await fetch(`/api/quotes?symbols=${symbols.join(",")}`);
  if (!response.ok) {
    return { ok: false, kind: "failed", detail: `The quotes route answered ${response.status}.` };
  }
  return (await response.json()) as Fetched<Quote[]>;
}

export function useQuotes(symbols: string[]) {
  const key = [...symbols].sort();
  return useQuery({
    queryKey: ["quotes", key.join(",")],
    queryFn: () => fetchQuotes(key),
  });
}

export function bySymbol(quotes: Quote[] | undefined): Map<string, Quote> {
  return new Map((quotes ?? []).map((quote) => [quote.symbol, quote]));
}
