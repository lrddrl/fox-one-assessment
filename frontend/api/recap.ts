/**
 * POST /api/recap  —  AI game recap / preview.
 *
 * Why this exists as a serverless function
 * ---------------------------------------
 * The MiniMax API key must never reach the browser. This endpoint is the only
 * place it is read (`process.env.MINIMAX_API_KEY`). The client sends a small,
 * already-sanitised game context; we build the prompt, call the model, and
 * return just the text.
 *
 * MiniMax exposes an **Anthropic-compatible** endpoint, so this speaks the
 * Anthropic Messages API shape (`POST {base}/v1/messages`, a top-level
 * `system` string, and a `content: [{type, text}]` response).
 *
 * Configuration (environment variables):
 *   MINIMAX_API_KEY   (required)  - your key
 *   MINIMAX_BASE_URL  (optional)  - default https://api.minimaxi.com/anthropic
 *   MINIMAX_MODEL     (optional)  - default MiniMax-M3
 *
 * If MINIMAX_API_KEY is missing we return 501 so the UI can degrade to
 * "AI not configured here" rather than showing an error.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const API_KEY = process.env.MINIMAX_API_KEY;
const BASE_URL =
  process.env.MINIMAX_BASE_URL ?? 'https://api.minimaxi.com/anthropic';
const MODEL = process.env.MINIMAX_MODEL ?? 'MiniMax-M3';

/** Short blurb — no need for a large budget. */
const MAX_TOKENS = 320;

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
    const upstream = await fetch(`${BASE_URL}/v1/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        // MiniMax's Anthropic-compatible endpoint authenticates via the
        // `X-Api-Key` header (verified against its error response), same as
        // Anthropic's own Messages API.
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        temperature: 0.4,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildPrompt(game) }],
      }),
    });

    if (!upstream.ok) {
      console.error(
        'MiniMax HTTP error',
        upstream.status,
        await safeText(upstream),
      );
      res.status(502).json({ error: 'upstream_error' });
      return;
    }

    const data = (await upstream.json()) as AnthropicMessage;

    const recap = (data.content ?? [])
      .filter((block) => block.type === 'text')
      .map((block) => block.text ?? '')
      .join('')
      .trim();

    if (!recap) {
      console.error('MiniMax empty/blocked response', JSON.stringify(data).slice(0, 500));
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

/** The slice of the Anthropic Messages response we read. */
interface AnthropicMessage {
  content?: { type?: string; text?: string }[];
}
