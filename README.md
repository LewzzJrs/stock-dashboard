# Stock dashboard

A dashboard for the US stock market: closing prices, price history, a
watchlist, and a practice account you can trade with play money at real
market prices.

Built with Next.js and the [Massive](https://massive.com) API. No accounts, no
database, no analytics. Your watchlist and your practice account live in your
own browser and are never sent anywhere.

## Pages

- **Dashboard** — a card for each thing you hold, a price chart beside your
  watchlist, the four funds that track the big US indices, and the biggest
  moves of the session. Your account total sits in the sidebar on every page.
- **Markets** — the full list with closing prices, sortable, filterable. A
  term the list cannot match is sent to Massive's symbol lookup instead.
- **Watchlist** — the symbols you starred, with their quotes.
- **Portfolio** — a practice account that starts at $100,000 in play money.
  Buy and sell at the last closing price, watch the value move with the
  market, and reset when you want to start over.

## Running it

You need Node 20 or newer and a free Massive API key.

1. Get a key at [massive.com](https://massive.com/pricing); the free plan is
   called Stocks Basic.
2. Copy the example environment file and paste your key into it:

```bash
cp .env.example .env.local
```

3. Install and start:

```bash
npm install
```

```bash
npm run dev
```

The app runs at `http://localhost:3000`. Without a key it still runs: every
section says which key is missing instead of showing invented numbers.

### Environment variables

| Name | Required | Purpose |
| --- | --- | --- |
| `MASSIVE_API_KEY` | yes | Used server-side for every Massive call, brand icons included. It never reaches the browser. |

## The free plan, and why it shapes the app

Massive's free plan (Stocks Basic) gives end-of-day data, five API calls a
minute, and two years of history. It does not charge per symbol, and that one
fact shapes most of the code:

- **One call carries the whole market.** `/v2/aggs/grouped/...` returns a daily
  bar for every US ticker, so pricing twenty symbols costs the same as pricing
  one. `lib/universe.ts` is a hand-picked list because the free plan has no
  "largest companies" endpoint, not because a longer list would cost more.
- **Two calls price every page.** The latest session and the one before it,
  which is what the day's change is measured against. Both are held for an
  hour.
- **The newest session is yesterday's.** The free plan refuses the running day
  until it has closed, so the app walks back from today until a session returns
  rows, skipping weekends and holidays. Every price on screen is a close, and
  the header says which session it came from.
- **Two years of history.** The chart's longest range is 2Y rather than a 5Y
  tab that would come back half empty.
- **Names are local.** The market summary carries symbols only, and asking for
  a name is one call per symbol, so `lib/universe.ts` holds the labels for the
  listed symbols and the search endpoint supplies names for anything else.
- **Brand icons arrive slowly the first time.** Massive has a logo for most
  companies and none for most funds. Each one is its own call, and five a
  minute is the ceiling, so `/api/icon` caches them for a week and the round
  tile shows the symbol's first two letters until the icon lands. A fund with
  no icon keeps the letters for good.

## The practice account

Play money, and the interface says so on the page. Orders fill instantly at
the last closing price Massive reported, with no spread, no commission, no
partial fills and no overnight gaps, so results will not match a real broker.
Because the free plan is end-of-day, the fill price is a close rather than a
live quote. Positions use average cost, so selling part of a holding carries
its share of what the whole lot cost.

The account lives in `localStorage` under `stock-dashboard.portfolio`. Clearing
your site data clears it, and it does not follow you to another browser.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server. |
| `npm run build` | Production build. |
| `npm start` | Serves the production build. |
| `npm run lint` | ESLint. |
| `npm run typecheck` | `tsc --noEmit`. |

## How it is put together

```
app/            routes, plus the three API routes that hold the API key
components/     the shell, the panels, the cards and the tables
hooks/          TanStack Query wrappers around the API routes
lib/            the Massive client, formatting, the symbol list
stores/         Zustand stores for the watchlist and the practice account
```

- **`lib/massive.ts`** is the only module that talks to the API. Every
  function returns `{ ok: true, data }` or `{ ok: false, kind, detail }`, where
  `kind` is one of `no-key`, `rate-limit`, `plan`, `empty` or `failed`. Nothing
  throws, and nothing falls back to invented numbers. A `plan` failure on a
  summary call means that session has not closed yet, which is why the date
  walk treats it as "step back a day" rather than an error.
- **`components/StateNotice.tsx`** turns those failures into a message that
  names the endpoint, the status and the next thing to try.
- **`app/api/*`** exists so the browser can refresh prices, search and load
  brand icons without ever seeing the API key.
- **Both stores** rehydrate from `localStorage` after mount, so anything that
  depends on stored state waits on `useStoresReady()` rather than rendering an
  empty list it would immediately replace.

## Licence

MIT. See [LICENSE](LICENSE).

Market data and brand icons come from Massive under their own terms. This
project is not affiliated with Massive, with any exchange, or with any company
whose symbol or logo it displays. Nothing here is investment advice.
