"use client";

import { useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Fetched, Quote } from "@/lib/massive";

/**
 * Every quote this session has already paid for, whichever page fetched it.
 *
 * The sidebar needs prices on every page but must not ask for its own, since a
 * second request would spend credits the page has already spent on the same
 * symbols. So this reads the query cache instead of fetching, and says nothing
 * when a symbol is not in it.
 */
export function useCachedQuotes(): Map<string, Quote> {
  const client = useQueryClient();
  const cache = client.getQueryCache();

  // The snapshot has to be a stable string: a fresh Map would never compare
  // equal and would re-render on every cache event.
  useSyncExternalStore(
    // The cache fires while a page component is still rendering its own
    // useQuery, and telling React about it there is an update during someone
    // else's render. A microtask puts it just after that render instead.
    (notify) => {
      let queued = false;
      return cache.subscribe(() => {
        if (queued) return;
        queued = true;
        queueMicrotask(() => {
          queued = false;
          notify();
        });
      });
    },
    () =>
      cache
        .findAll({ queryKey: ["quotes"] })
        .map((query) => `${query.queryHash}:${query.state.dataUpdatedAt}`)
        .join("|"),
    () => "",
  );

  const index = new Map<string, Quote>();
  for (const query of cache.findAll({ queryKey: ["quotes"] })) {
    const data = query.state.data as Fetched<Quote[]> | undefined;
    if (!data?.ok) continue;
    for (const quote of data.data) index.set(quote.symbol, quote);
  }
  return index;
}
