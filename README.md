# FOX One Take-Home Assessment

Two parts, one repository.

| | |
|---|---|
| **[`frontend/`](./frontend)** | **Part 1** — a React 19 + Vite + TypeScript app: a live sports scoreboard for the leagues FOX broadcasts (MLB, NFL, college football), with an "On FOX" filter and an AI-written game recap / preview powered by MiniMax behind a serverless proxy. **Live: https://fox-one-scoreboard.vercel.app** |
| **[`python/`](./python)** | **Part 2** — five standard-library Python exercises with a 51-test `unittest` suite. |

Each part has its own README with the design decisions and trade-offs:
**[frontend/README.md](./frontend/README.md)** · **[python/README.md](./python/README.md)**.

## Quick start

### Part 2 — Python (no dependencies)

```bash
python -m unittest discover -s python/tests -t python -v
```

### Part 1 — frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173, live ESPN data
```

The AI recap runs on a serverless function. `npm run dev` shows the app with
that feature degrading gracefully; `npx vercel dev` (with a `MINIMAX_API_KEY` in
`frontend/.env.local`) runs it for real. Details in
[frontend/README.md](./frontend/README.md).

## Deployment

The frontend deploys to Vercel from `main` (Root Directory `frontend`, Vite
preset). Live demo: **https://fox-one-scoreboard.vercel.app**
