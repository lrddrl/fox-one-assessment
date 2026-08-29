# Part 1 — FOX Sports Scoreboard

A live scoreboard for the leagues FOX broadcasts (MLB, NFL, college football),
with an AI-written recap / preview for any game.

> **Additional feature:** the AI recap. Tap **AI recap** on a card and a
> serverless function sends that game's data to MiniMax and returns two or three
> sentences — a preview before kickoff, a live read during the game, a recap
> after. The app works fully without it (the panel just explains it's not
> configured).

## Stack

| Choice | Why |
|---|---|
| **React 19 + Vite + TypeScript** | Current, fast dev loop, types catch the shape mismatches you get from an untyped API. |
| **ESPN's public JSON API** | No key — `git clone && npm install && npm run dev` just works. Trade-off below. |
| **Plain `fetch` in a hook** | The brief asks for minimal dependencies. `useScoreboard` is ~90 readable lines. TanStack Query / SWR would be the next step for caching + dedupe. |
| **CSS Modules** | Scoped styles, co-located with components, zero runtime, no extra dependency. |
| **Vercel serverless function** for the AI call | Keeps the MiniMax key server-side. The browser never sees it. |

## Run it

```bash
npm install
npm run dev            # http://localhost:5173
```

`npm run dev` runs the whole UI against live ESPN data. The **AI recap** needs
the serverless function, which the bare Vite server doesn't run — the panel
degrades to a short explanation. To exercise it locally:

```bash
cp .env.example .env.local     # then paste your MiniMax key into .env.local
npx vercel dev                 # serves the app + /api together
```

Other scripts: `npm run build` (type-check + production build), `npm run lint`.

## How it's put together

```
src/
  config/leagues.ts     Which leagues to show (id, label, ESPN path). Add one here.
  types.ts              Domain types — decoupled from ESPN's field names.
  lib/
    espn.ts             fetch + normalise ESPN's response into our types
    recap.ts            client for POST /api/recap
    format.ts           pure date / "x ago" helpers
  hooks/
    useScoreboard.ts    fetch + polling + cancellation + derived status
    useRelativeTime.ts  live-updating "updated 12s ago"
    useTheme.ts         dark/light, persisted, system-aware
  components/           presentational; one folder-level concern each
api/
  recap.ts              serverless MiniMax proxy
```

**Data flow:** `App` holds the two pieces of UI state (`leagueId`,
`autoRefresh`) and passes them to `useScoreboard`, which owns everything async
and returns `{ games, status, error, lastUpdated, isRefreshing, refresh }`.
Components below are presentational.

## Design decisions worth calling out

- **The ESPN API is undocumented.** It can change without notice. Mitigations:
  `lib/espn.ts` types only the ~12 fields we read and treats every one as
  optional; `normalizeEvent` skips a malformed game rather than throwing, so one
  bad record can't blank the board. A production version would put this behind
  our own cached endpoint.
- **Loading state is derived, not stored.** `useScoreboard` compares the
  requested league to the loaded one; if they differ, we're "loading". This
  avoids resetting state inside an effect when you switch leagues.
- **Failed refresh ≠ failed load.** If a background poll fails but we already
  have games, the board keeps showing them with a "may be stale" note. Only a
  failed *first* load shows the full error screen.
- **The AI feature fails soft.** Timeout, no key, bad response, offline — every
  path resolves to a message, never a broken card. Results are cached per game
  for the page's lifetime so re-opening is instant and costs no quota.
- **Accessibility:** the league switcher is a real ARIA tablist with arrow-key
  navigation; every control has a visible focus ring; animation is dropped under
  `prefers-reduced-motion`.

## The AI recap function (`api/recap.ts`)

`POST /api/recap` with `{ game: { league, state, status, venue, home, away } }`
→ `{ recap: string }`.

MiniMax exposes an **Anthropic-compatible** endpoint, so the function speaks the
Anthropic Messages API shape: `POST {base}/v1/messages`, auth via the
`X-Api-Key` header, a top-level `system` string, and a `content: [{ type, text }]`
response.

| Variable | Required | Default |
|---|---|---|
| `MINIMAX_API_KEY` | yes | — |
| `MINIMAX_BASE_URL` | no | `https://api.minimaxi.com/anthropic` |
| `MINIMAX_MODEL` | no | `MiniMax-M3` |

The prompt forbids betting advice, winner predictions, and invented stats, and
asks for tense to match the game state. Responses are edge-cached for 5 minutes.
If `MINIMAX_API_KEY` is unset the function returns `501` and the UI shows the
"not configured here" note.

## Deploying to Vercel

The repo is a monorepo; this app lives in `frontend/`.

1. Import the GitHub repo in Vercel. Set **Root Directory** to `frontend`.
   Framework preset **Vite** is detected automatically.
2. Add the environment variables above under **Settings → Environment
   Variables** (at least `MINIMAX_API_KEY`).
3. Every push to `main` deploys to production; pull requests get preview URLs.

## With more time

- A thin cached backend proxy for ESPN instead of calling it from the browser.
- Persisted "favourite teams" filter.
- Stream the recap token-by-token instead of waiting for the full response.
- A small test suite (Vitest + Testing Library) around `lib/espn.ts`
  normalisation and `useScoreboard` state transitions.
