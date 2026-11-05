"use client";

import { useState } from "react";

/**
 * The round tile beside a symbol. Massive carries a brand icon for most
 * companies and none for most funds, so the symbol's first two letters sit
 * underneath and show through whenever the icon is missing or slow.
 */
const SIZES = {
  sm: "size-8 text-[11px]",
  md: "size-9 text-xs",
  lg: "size-11 text-sm",
} as const;

export function SymbolMark({
  symbol,
  size = "md",
}: {
  symbol: string;
  size?: keyof typeof SIZES;
}) {
  const [shown, setShown] = useState(false);
  const [missing, setMissing] = useState(false);

  return (
    <span
      aria-hidden="true"
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-raised font-semibold text-accent ${SIZES[size]}`}
    >
      {symbol.slice(0, 2)}
      {missing ? null : (
        // Our own route serves this, at whatever size Massive holds, so
        // next/image has nothing to optimise and no dimensions to work from.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/icon?symbol=${encodeURIComponent(symbol)}`}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={() => setShown(true)}
          onError={() => setMissing(true)}
          className={`absolute inset-0 size-full object-cover ${shown ? "" : "opacity-0"}`}
        />
      )}
    </span>
  );
}
