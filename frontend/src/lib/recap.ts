/**
 * Client for the AI recap feature.
 *
 * The browser never talks to MiniMax directly — it calls our own `/api/recap`
 * serverless function, which holds the API key. This module shapes the request
 * and maps the response into a small union the UI can switch on.
 */

import type { Game } from '../types';

export type RecapResult =
  | { status: 'ok'; text: string }
  /** The serverless function has no API key configured (e.g. plain `vite dev`). */
  | { status: 'unconfigured' }
  | { status: 'error'; message: string };

export async function fetchRecap(game: Game): Promise<RecapResult> {
  let response: Response;
  try {
    response = await fetch('/api/recap', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ game: toRecapContext(game) }),
    });
  } catch {
    return { status: 'error', message: 'Could not reach the recap service.' };
  }

  // 501 = key not set on the server. 404 = no serverless runtime at all
  // (the bare Vite dev server). Both mean "AI isn't available here".
  if (response.status === 501 || response.status === 404) {
    return { status: 'unconfigured' };
  }
  if (!response.ok) {
    return {
      status: 'error',
      message: `Recap service error (${response.status}).`,
    };
  }

  const data = (await response.json()) as { recap?: string };
  if (!data.recap) {
    return { status: 'error', message: 'The recap came back empty.' };
  }
  return { status: 'ok', text: data.recap };
}

/**
 * Send only what the model needs — keeps the request tiny and hands a third
 * party no more of the payload than necessary.
 */
function toRecapContext(game: Game) {
  return {
    league: game.leagueLabel,
    state: game.state,
    status: game.statusDetail,
    venue: game.venue,
    home: teamContext(game.home),
    away: teamContext(game.away),
  };
}

function teamContext(team: Game['home']) {
  return {
    name: team.displayName,
    score: team.score,
    record: team.record,
    rank: team.rank,
  };
}
