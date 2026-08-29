/**
 * POST /api/recap  —  AI game recap / preview.
 *
 * Why this exists as a serverless function
 * ---------------------------------------
 * The MiniMax API key must never reach the browser. This endpoint is the only
 * place it is read (`process.env.MINIMAX_API_KEY`). The client sends a small,
 * already-sanitised game context; we build the prompt, call MiniMax, and return
 * just the text.
 *
 * Configuration (all via environment variables, so the same code works for
 * MiniMax's domestic and international hosts and survives model renames):
 *   MINIMAX_API_KEY   (required)  - your key
 *   MINIMAX_BASE_URL  (optional)  - default https://api.minimaxi.chat/v1
 *   MINIMAX_MODEL     (optional)  - default MiniMax-Text-01
 *   MINIMAX_GROUP_ID  (optional)  - only if your account requires it
 *
 * If MINIMAX_API_KEY is missing we return 501 so the UI can degrade to
 * "AI not configured here" rather than showing an error.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const API_KEY = process.env.MINIMAX_API_KEY;
const BASE_URL = process.env.MINIMAX_BASE_URL ?? 'https://api.minimaxi.chat/v1';
const MODEL = process.env.MINIMAX_MODEL ?? 'MiniMax-Text-01';
const GROUP_ID = process.env.MINIMAX_GROUP_ID;

const SYSTEM_PROMPT = [
  'You are a concise sports desk writer.',
  'Given structured data about a single game, write 2 to 3 factual sentences.',
  'Do not give betting advice, predict a winner, or invent statistics.',
  'Match the tense to the game state: preview an upcoming game, describe a live',
  'game in the present tense, and recap a finished game in the past tense.',
].join(' ');

interface TeamContext {
  name?: string;
  score?: number | null;
  record?: string | null;
  rank?: number | null;
}

interface RecapContext {
  league?: string;
  state?: 'pre' | 'in' | 'post';
  status?: string;
  venue?: string | null;
  home?: TeamContext;
  away?: TeamContext;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  if (!API_KEY) {
    res.status(501).json({ error: 'not_configured' });
    return;
  }

  const game = (req.body?.game ?? {}) as RecapContext;
  if (!game.home?.name || !game.away?.name) {
    res.status(400).json({ error: 'invalid_game' });
    return;
  }

  try {
    const upstream = await fetch(
      `${BASE_URL}/text/chatcompletion_v2${GROUP_ID ? `?GroupId=${GROUP_ID}` : ''}`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: buildPrompt(game) },
          ],
          temperature: 0.4,
          max_tokens: 220,
        }),
      },
    );

    if (!upstream.ok) {
      console.error('MiniMax HTTP error', upstream.status, await safeText(upstream));
      res.status(502).json({ error: 'upstream_error' });
      return;
    }

    const data = (await upstream.json()) as MiniMaxResponse;

    // MiniMax returns HTTP 200 even for logical errors; the real status is in
    // base_resp.status_code (0 = success).
    if (data.base_resp?.status_code != null && data.base_resp.status_code !== 0) {
      console.error('MiniMax logical error', data.base_resp);
      res.status(502).json({ error: 'upstream_error' });
      return;
    }

    const recap = data.choices?.[0]?.message?.content?.trim();
    if (!recap) {
      res.status(502).json({ error: 'empty_response' });
      return;
    }

    // Edge-cache briefly: a blurb doesn't need to track the score second by
    // second, and this protects the API quota under load.
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).json({ recap });
  } catch (error) {
    console.error('recap handler failed', error);
    res.status(502).json({ error: 'upstream_error' });
  }
}

function buildPrompt(game: RecapContext): string {
  return [
    `League: ${game.league ?? 'unknown'}`,
    `State: ${game.state ?? 'unknown'} (${game.status ?? 'n/a'})`,
    game.venue ? `Venue: ${game.venue}` : null,
    teamLine('Away', game.away),
    teamLine('Home', game.home),
  ]
    .filter(Boolean)
    .join('\n');
}

function teamLine(side: string, team?: TeamContext): string {
  if (!team?.name) return `${side}: TBD`;
  const parts = [team.name];
  if (team.rank) parts.push(`(#${team.rank})`);
  if (team.record) parts.push(`record ${team.record}`);
  if (team.score != null) parts.push(`score ${team.score}`);
  return `${side}: ${parts.join(' ')}`;
}

async function safeText(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 500);
  } catch {
    return '<unreadable>';
  }
}

interface MiniMaxResponse {
  choices?: { message?: { content?: string } }[];
  base_resp?: { status_code?: number; status_msg?: string };
}
