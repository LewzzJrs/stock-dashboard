/**
 * Massive's daily market summary returns every US ticker in a single call, so
 * the length of this list no longer costs anything. It is still written down
 * rather than ranked: the free plan has no "largest companies" endpoint, and
 * the Markets page says so instead of calling it a top twenty.
 *
 * The labels live here because the summary carries symbols only, and asking
 * Massive for a name is one call per symbol.
 */
export const UNIVERSE = [
  { symbol: "SPY", label: "SPDR S&P 500 ETF", kind: "etf" },
  { symbol: "QQQ", label: "Invesco QQQ Trust", kind: "etf" },
  { symbol: "DIA", label: "SPDR Dow Jones Industrial Average ETF", kind: "etf" },
  { symbol: "IWM", label: "iShares Russell 2000 ETF", kind: "etf" },
  { symbol: "AAPL", label: "Apple", kind: "stock" },
  { symbol: "MSFT", label: "Microsoft", kind: "stock" },
  { symbol: "NVDA", label: "NVIDIA", kind: "stock" },
  { symbol: "GOOGL", label: "Alphabet", kind: "stock" },
  { symbol: "AMZN", label: "Amazon", kind: "stock" },
  { symbol: "META", label: "Meta Platforms", kind: "stock" },
  { symbol: "TSLA", label: "Tesla", kind: "stock" },
  { symbol: "AVGO", label: "Broadcom", kind: "stock" },
  { symbol: "JPM", label: "JPMorgan Chase", kind: "stock" },
  { symbol: "V", label: "Visa", kind: "stock" },
  { symbol: "UNH", label: "UnitedHealth", kind: "stock" },
  { symbol: "XOM", label: "Exxon Mobil", kind: "stock" },
  { symbol: "JNJ", label: "Johnson & Johnson", kind: "stock" },
  { symbol: "WMT", label: "Walmart", kind: "stock" },
  { symbol: "PG", label: "Procter & Gamble", kind: "stock" },
  { symbol: "KO", label: "Coca-Cola", kind: "stock" },
] as const;

export const UNIVERSE_SYMBOLS: string[] = UNIVERSE.map((entry) => entry.symbol);

/** Symbol to company name, for everything on the list. */
export const UNIVERSE_NAMES: Record<string, string> = Object.fromEntries(
  UNIVERSE.map((entry) => [entry.symbol, entry.label]),
);

/** The index funds the dashboard opens with, kept apart from single stocks. */
export const TAPE_SYMBOLS = ["SPY", "QQQ", "DIA", "IWM"];

/**
 * The free plan holds two years, so the longest range stops there rather than
 * offering a five-year tab that would come back half empty.
 */
export const RANGES = [
  { key: "1m", label: "1M", multiplier: 1, timespan: "day", days: 31 },
  { key: "6m", label: "6M", multiplier: 1, timespan: "day", days: 184 },
  { key: "1y", label: "1Y", multiplier: 1, timespan: "week", days: 366 },
  { key: "2y", label: "2Y", multiplier: 1, timespan: "week", days: 730 },
] as const;

export type RangeKey = (typeof RANGES)[number]["key"];

export function resolveRange(key: string | null | undefined) {
  return RANGES.find((range) => range.key === key) ?? RANGES[1];
}
