/**
 * ESPN scoreboard client.
 *
 * ESPN exposes an unofficial, undocumented JSON API at site.api.espn.com. It
 * needs no key, which keeps this project trivial to clone and run, but the
 * trade-off is that the shape can change without notice. Two defences:
 *   1. We type only the handful of fields we actually read (`Espn*` below) and
 *      treat every one as optional.
 *   2. `normalizeEvent` skips any event it can't understand rather than throwing,
 *      so one malformed game never blanks the whole board.
 */

import type { LeagueConfig } from '../config/leagues';
import type { Game, GameState, TeamSide } from '../types';

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

/** Networks that a FOX One subscriber can actually watch. */
const FOX_NETWORKS = ['FOX', 'FS1', 'FS2', 'FOX DEPORTES'];

/** Error type the UI can recognise and show a friendly message for. */
export class ScoreboardError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ScoreboardError';
  }
}

export async function fetchScoreboard(league: LeagueConfig): Promise<Game[]> {
  const url = `${ESPN_BASE}/${league.espnPath}/scoreboard`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new ScoreboardError('Could not reach the scoreboard service.', {
      cause: error,
    });
  }

  if (!response.ok) {
    throw new ScoreboardError(
      `Scoreboard service responded with ${response.status}.`,
    );
  }

  const payload = (await response.json()) as EspnScoreboardResponse;
  return (payload.events ?? [])
    .map((event) => normalizeEvent(event, league.label))
    .filter((game): game is Game => game !== null);
}

// --- Normalisation ----------------------------------------------------------

function normalizeEvent(event: EspnEvent, leagueLabel: string): Game | null {
  const competition = event.competitions?.[0];
  const competitors = competition?.competitors ?? [];
  const home = competitors.find((competitor) => competitor.homeAway === 'home');
  const away = competitors.find((competitor) => competitor.homeAway === 'away');

  // A game without two identifiable sides isn't renderable — skip it.
  if (!home || !away || !event.id) return null;

  const status = competition?.status ?? event.status;
  const broadcast =
    competition?.broadcasts?.flatMap((broadcast) => broadcast.names ?? [])[0] ??
    null;

  return {
    id: event.id,
    leagueLabel,
    state: toGameState(status?.type?.state),
    statusDetail:
      status?.type?.shortDetail ?? status?.type?.description ?? 'Scheduled',
    startTime: event.date ?? '',
    home: toTeamSide(home),
    away: toTeamSide(away),
    venue: competition?.venue?.fullName ?? null,
    broadcast,
    isOnFox: broadcast
      ? FOX_NETWORKS.some((network) =>
          broadcast.toUpperCase().includes(network),
        )
      : false,
  };
}

function toGameState(state: string | undefined): GameState {
  if (state === 'in' || state === 'post') return state;
  return 'pre';
}

/**
 * ESPN serves a `/scoreboard/` logo variant that, for some leagues (NFL), is a
 * white monochrome version meant for their own dark UI. Dropping that segment
 * gives the canonical full-colour crest, which reads on both our themes.
 */
function normalizeLogo(url: string | undefined): string | null {
  if (!url) return null;
  return url.replace('/scoreboard/', '/');
}

function toTeamSide(competitor: EspnCompetitor): TeamSide {
  const parsedScore = Number(competitor.score);
  const totalRecord =
    competitor.records?.find((record) => record.type === 'total') ??
    competitor.records?.[0];
  const rank = competitor.curatedRank?.current;

  return {
    id: competitor.team?.id ?? competitor.id ?? crypto.randomUUID(),
    displayName: competitor.team?.displayName ?? 'To be decided',
    shortName:
      competitor.team?.shortDisplayName ??
      competitor.team?.abbreviation ??
      'TBD',
    abbreviation: competitor.team?.abbreviation ?? '--',
    logoUrl: normalizeLogo(competitor.team?.logo),
    color: competitor.team?.color ? `#${competitor.team.color}` : null,
    score: Number.isFinite(parsedScore) ? parsedScore : null,
    record: totalRecord?.summary ?? null,
    // ESPN reports 99 for "unranked"; only keep a real top-25 number.
    rank: typeof rank === 'number' && rank >= 1 && rank <= 25 ? rank : null,
    isWinner: competitor.winner === true,
  };
}

// --- The slice of ESPN's response we depend on -----------------------------

interface EspnScoreboardResponse {
  events?: EspnEvent[];
}

interface EspnEvent {
  id?: string;
  date?: string;
  status?: EspnStatus;
  competitions?: EspnCompetition[];
}

interface EspnCompetition {
  competitors?: EspnCompetitor[];
  venue?: { fullName?: string };
  broadcasts?: { names?: string[] }[];
  status?: EspnStatus;
}

interface EspnStatus {
  type?: {
    state?: string;
    completed?: boolean;
    description?: string;
    shortDetail?: string;
  };
}

interface EspnCompetitor {
  id?: string;
  homeAway?: 'home' | 'away';
  winner?: boolean;
  score?: string;
  team?: {
    id?: string;
    displayName?: string;
    shortDisplayName?: string;
    abbreviation?: string;
    logo?: string;
    color?: string;
  };
  records?: { type?: string; summary?: string }[];
  curatedRank?: { current?: number };
}
