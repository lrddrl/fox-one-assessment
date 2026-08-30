# Part 1 — FOX Sports Scoreboard

A live scoreboard for the leagues FOX broadcasts (MLB, NFL, college football),
with an AI-written recap / preview for any game.

**Live demo:** https://fox-one-scoreboard.vercel.app

## Meeting the brief

| The brief asks for | Where it is |
|---|---|
| A new app in React or Vue (latest) | React 19 + Vite 8 + TypeScript |
| Query a publicly available API | ESPN's public scoreboard API — no key required ([why this one](#why-this-api)) |
| Display the data in a list | A responsive grid of game cards, one per game, for the selected league |
| **One additional feature of your choice** *(e.g. state management, CSS, some client-side effect)* | **The AI recap** — see below. The brief's three examples are all exercised too; the table under [Additional feature](#additional-feature) says where. |
| Push to GitHub | [github.com/lrddrl/fox-one-assessment](https://github.com/lrddrl/fox-one-assessment) |

### Additional feature

**The AI recap.** Tap **AI recap** on a card and a serverless function sends that
game's data to MiniMax, which returns two or three sentences — a preview before
kickoff, a live read during the game, a recap after. It turns a box score into
something a casual fan can read. The app works fully without it (the panel
explains it isn't configured rather than erroring).

The brief offered *state management, CSS, or some client-side effect* as
examples of what an additional feature might be. The AI recap is a client-side
effect end to end, and the other two are exercised as well:

| Example from the brief | In this app |
|---|---|
| **State management** | `useScoreboard` — a custom hook owning all async state (games, status, error, `lastUpdated`, `isRefreshing`) with a *derived* loading status and per-request cancellation; `useTheme` (persisted); and a module-level `Map` in `GameRecap` caching recaps by game id. No state-management library — the state doesn't warrant one; see [Design decisions](#design-decisions-worth-calling-out). |
| **CSS** | A token-based design system in `index.css` (colour, spacing, radii, type scales) driving a full dark **and** light theme, with CSS Modules scoped per component. Loading skeletons and the live-game pulse are CSS animations, dropped under `prefers-reduced-motion`. |
| **Client-side effect** | 30-second polling with an `AbortController` per request; a live "updated 12s ago" ticker; theme persistence; and the lazy, cached, per-card AI fetch. |

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

## Why this API

The app reads `site.api.espn.com/apis/site/v2/sports/{sport}/{league}/scoreboard`
— the JSON endpoint ESPN's own site and apps call. It is **publicly accessible
without a key or an account**, but ESPN publishes no documentation for it and
offers no stability guarantee.

Three reasons it won this project:

1. **No key, so this repo runs on first clone.** `npm install && npm run dev`
   gives you live scores. Every documented, supported sports API I looked at
   (SportsData.io, API-Sports) requires signing up for a key — which would mean
   either a reviewer registering for one before they can run this, or me
   committing my own key. Neither is acceptable for a take-home.
2. **One source, one response shape, all three FOX leagues.** MLB, NFL, and
   college football differ only by a path segment, so adding a league is one
   line in `config/leagues.ts`. MLB's own free API (`statsapi.mlb.com`) is
   excellent but MLB-only, with no NFL or college-football counterpart — I'd
   have had to integrate three unrelated APIs to cover the same ground.
3. **Rich enough for a real scoreboard.** Live status ("Top 5th", "Halftime"),
   scores, season records, AP rank, venue, and the broadcast network — the last
   of which is what lets the app badge the games FOX actually carries.

Also considered: **TheSportsDB**, whose free tier shares one public test key, is
tightly rate-limited, carries community-maintained data, and has patchy live
scores — too unreliable to demo.

**The trade-off:** an undocumented endpoint can change shape without notice. That
is a real risk and it is handled deliberately rather than ignored — see the
first bullet under [Design decisions](#design-decisions-worth-calling-out).

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
Everything below `App` is presentational — given props, renders markup.

## Design decisions worth calling out

- **The ESPN API is undocumented.** It can change without notice. Mitigations:
  `lib/espn.ts` types only the ~12 fields we read and treats every one as
  optional; `normalizeEvent` skips a malformed game rather than throwing, so one
  bad record can't blank the board. A production version would put this behind
  our own cached endpoint.
- **No state-management library.** There are two pieces of UI state
  (`leagueId`, `autoRefresh`) and one data hook. `useState` plus a custom hook
  is the entire surface — Redux or Zustand here would be ceremony, and the brief
  asks to keep it simple. The line I'd cross for one: shared state that several
  distant components both read *and* write. Nothing in this app does.
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
- Stream the recap token-by-token instead of waiting for the full response.
- Smarter polling: pause on a hidden tab, back off on repeated failure.
- A small test suite (Vitest + Testing Library) around `lib/espn.ts`
  normalisation and `useScoreboard` state transitions.
