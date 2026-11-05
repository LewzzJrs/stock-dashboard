/**
 * The only module that talks to Massive. Nothing here throws: every failure
 * comes back as a typed state the UI can put into a sentence.
 *
 * The free plan is end-of-day, 5 calls a minute, two years of history, and it
 * does not charge per symbol. That last part shapes the whole module: one
 * "daily market summary" call carries every US ticker for a session, so the
 * price of a page no longer grows with the length of the list.
 */
const BASE = "https://api.massive.com";

export type Failure = {
  ok: false;
  kind: "no-key" | "rate-limit" | "plan" | "empty" | "failed";
  detail: string;
};

export type Fetched<T> = { ok: true; data: T } | Failure;

export type Quote = {
  symbol: string;
  name: string;
  /** The trading session these figures close, as YYYY-MM-DD. */
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  previousClose: number;
  change: number;
  percentChange: number;
  volume: number | null;
};

export type Candle = { date: string; close: number };

export type SearchHit = {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
};

type Bar = { T?: string; o?: number; h?: number; l?: number; c?: number; v?: number };
type Grouped = { resultsCount?: number; results?: Bar[] };
type Session = { date: string; bars: Map<string, Bar> };

function classify(status: number, message: string): Failure {
  if (status === 429) {
    return {
      ok: false,
      kind: "rate-limit",
      detail: message,
    };
  }
  if (status === 401) {
    return { ok: false, kind: "no-key", detail: message };
  }
  if (status === 403) {
    return { ok: false, kind: "plan", detail: message };
  }
  if (status === 404) {
    return { ok: false, kind: "empty", detail: message };
  }
  return { ok: false, kind: "failed", detail: message };
}

async function call<T>(
  path: string,
  params: Record<string, string>,
  revalidate: number,
): Promise<Fetched<T>> {
  const key = process.env.MASSIVE_API_KEY;
  if (!key) {
    return { ok: false, kind: "no-key", detail: "MASSIVE_API_KEY is not set." };
  }

  const url = new URL(`${BASE}${path}`);
  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, value);
  }
  url.searchParams.set("apiKey", key);

  let response: Response;
  try {
    response = await fetch(url, { next: { revalidate } });
  } catch {
    return { ok: false, kind: "failed", detail: "Could not reach api.massive.com." };
  }

  if (!response.ok) {
    // The body carries the useful sentence; the status line only says which kind.
    let message = `Massive returned HTTP ${response.status} for ${path}.`;
    try {
      const body = (await response.json()) as { message?: string; error?: string };
      if (body.message || body.error) message = `${message} ${body.message ?? body.error}`;
    } catch {
      // A non-JSON error body tells us nothing more than the status line did.
    }
    return classify(response.status, message);
  }

  return { ok: true, data: (await response.json()) as T };
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** The hour in New York right now, where the US session opens and closes. */
function easternHour(): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
  );
}

/**
 * The last trading sessions, newest first.
 *
 * Three things make this a walk rather than a lookup: the free plan refuses
 * the current day until it has closed (403), weekends and holidays answer 200
 * with no rows, and the plan offers no calendar endpoint to ask instead.
 *
 * The walk skips the current day until the New York close has passed, because
 * asking for it early spends one of the five calls a minute on a refusal.
 */
async function recentSessions(count: number): Promise<Fetched<Session[]>> {
  const sessions: Session[] = [];
  const cursor = new Date();
  if (easternHour() < 17) cursor.setUTCDate(cursor.getUTCDate() - 1);

  for (let step = 0; step < 10 && sessions.length < count; step += 1) {
    const date = isoDay(cursor);
    cursor.setUTCDate(cursor.getUTCDate() - 1);

    const result = await call<Grouped>(
      `/v2/aggs/grouped/locale/us/market/stocks/${date}`,
      { adjusted: "true" },
      3600,
    );

    if (!result.ok) {
      // "plan" here is the session that has not closed yet, so step back a day.
      if (result.kind === "plan") continue;
      return result;
    }

    const rows = result.data.results ?? [];
    if (rows.length === 0) continue;

    sessions.push({
      date,
      bars: new Map(rows.filter((row) => row.T).map((row) => [row.T as string, row])),
    });
  }

  if (sessions.length === 0) {
    return {
      ok: false,
      kind: "empty",
      detail: "No closed trading session was found in the last ten days.",
    };
  }
  return { ok: true, data: sessions };
}

/**
 * Prices for the symbols asked for. Costs the same two calls whether you ask
 * for one symbol or two hundred, and both are cached for an hour.
 *
 * `names` lets the caller supply what it already knows; Massive's summary
 * carries symbols only, and asking for a name is a call per symbol.
 */
export async function getQuotes(
  symbols: string[],
  names: Record<string, string> = {},
): Promise<Fetched<Quote[]>> {
  if (symbols.length === 0) return { ok: true, data: [] };

  const sessions = await recentSessions(2);
  if (!sessions.ok) return sessions;

  const [latest, prior] = sessions.data;
  const quotes: Quote[] = [];

  for (const symbol of symbols) {
    const bar = latest.bars.get(symbol);
    if (!bar || bar.c === undefined) continue;

    // Without the session before it, the day's own open is the honest baseline.
    const previousClose = prior?.bars.get(symbol)?.c ?? bar.o ?? bar.c;
    const change = bar.c - previousClose;

    quotes.push({
      symbol,
      name: names[symbol] ?? "",
      date: latest.date,
      open: bar.o ?? bar.c,
      high: bar.h ?? bar.c,
      low: bar.l ?? bar.c,
      close: bar.c,
      previousClose,
      change,
      percentChange: previousClose === 0 ? 0 : (change / previousClose) * 100,
      volume: bar.v ?? null,
    });
  }

  if (quotes.length === 0) {
    return {
      ok: false,
      kind: "empty",
      detail: `The ${latest.date} summary carries none of ${symbols.join(", ")}.`,
    };
  }
  return { ok: true, data: quotes };
}

type AggsResponse = { results?: { t?: number; c?: number }[] };

export async function getSeries(
  symbol: string,
  multiplier: number,
  timespan: string,
  days: number,
): Promise<Fetched<Candle[]>> {
  const to = new Date();
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - days);

  const result = await call<AggsResponse>(
    `/v2/aggs/ticker/${encodeURIComponent(symbol)}/range/${multiplier}/${timespan}/${isoDay(from)}/${isoDay(to)}`,
    { adjusted: "true", sort: "asc", limit: "5000" },
    3600,
  );
  if (!result.ok) return result;

  const candles = (result.data.results ?? [])
    .filter((row) => row.t !== undefined && row.c !== undefined)
    .map((row) => ({ date: isoDay(new Date(row.t as number)), close: row.c as number }));

  if (candles.length === 0) {
    return { ok: false, kind: "empty", detail: `Massive returned no bars for ${symbol}.` };
  }
  return { ok: true, data: candles };
}

type TickerRow = { ticker?: string; name?: string; primary_exchange?: string; type?: string };

export async function searchSymbols(query: string): Promise<Fetched<SearchHit[]>> {
  const result = await call<{ results?: TickerRow[] }>(
    "/v3/reference/tickers",
    { search: query, market: "stocks", active: "true", limit: "20" },
    86400,
  );
  if (!result.ok) return result;

  const hits = (result.data.results ?? [])
    .filter((row) => row.ticker)
    .map((row) => ({
      symbol: row.ticker as string,
      name: row.name ?? "",
      exchange: row.primary_exchange ?? "",
      type: row.type ?? "",
    }));

  if (hits.length === 0) {
    return { ok: false, kind: "empty", detail: `Massive matched nothing for “${query}”.` };
  }
  return { ok: true, data: hits };
}

/**
 * The square brand icon for a symbol, if Massive has one. The URL it returns
 * needs the API key, so the image is fetched here and handed on by the route
 * rather than pointed at from the browser.
 */
export async function getIcon(
  symbol: string,
): Promise<Fetched<{ body: ArrayBuffer; type: string }>> {
  const key = process.env.MASSIVE_API_KEY;
  if (!key) return { ok: false, kind: "no-key", detail: "MASSIVE_API_KEY is not set." };

  const detail = await call<{ results?: { branding?: { icon_url?: string } } }>(
    `/v3/reference/tickers/${encodeURIComponent(symbol)}`,
    {},
    86400,
  );
  if (!detail.ok) return detail;

  const iconUrl = detail.data.results?.branding?.icon_url;
  if (!iconUrl) {
    return { ok: false, kind: "empty", detail: `Massive holds no icon for ${symbol}.` };
  }

  let response: Response;
  try {
    response = await fetch(`${iconUrl}?apiKey=${encodeURIComponent(key)}`, {
      next: { revalidate: 604800 },
    });
  } catch {
    return { ok: false, kind: "failed", detail: "Could not reach the branding host." };
  }
  if (!response.ok) {
    return classify(response.status, `The icon for ${symbol} answered ${response.status}.`);
  }

  return {
    ok: true,
    data: {
      body: await response.arrayBuffer(),
      type: response.headers.get("content-type") ?? "image/png",
    },
  };
}
