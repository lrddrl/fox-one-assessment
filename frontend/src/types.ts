/**
 * Domain types for the scoreboard.
 *
 * These are intentionally decoupled from the ESPN API response shape: `lib/espn.ts`
 * maps the raw (undocumented) payload into these types once, so the rest of the app
 * never touches ESPN's field names and a future data-source swap stays contained.
 */

/** Where a game is in its lifecycle. Mirrors ESPN's `status.type.state`. */
export type GameState = 'pre' | 'in' | 'post';

export interface TeamSide {
  id: string;
  /** Full name, e.g. "Los Angeles Dodgers". */
  displayName: string;
  /** Compact name for tight layouts, e.g. "Dodgers". */
  shortName: string;
  abbreviation: string;
  logoUrl: string | null;
  /** Brand colour as a CSS hex string ("#005a9c"), or null if unknown. */
  color: string | null;
  /** Points/runs. `null` until the game starts. */
  score: number | null;
  /** Win–loss record, e.g. "70-58". */
  record: string | null;
  /** AP/Coaches poll rank (1–25) for college football, else null. */
  rank: number | null;
  isWinner: boolean;
}

export interface Game {
  id: string;
  leagueLabel: string;
  state: GameState;
  /** Ready-to-display status, e.g. "Final", "Top 5th", "7:40 - FOX". */
  statusDetail: string;
  /** ISO 8601 start time. */
  startTime: string;
  home: TeamSide;
  away: TeamSide;
  venue: string | null;
  /** Broadcast network name, e.g. "FOX", "FS1", "ESPN". */
  broadcast: string | null;
  /** True when a FOX-family network carries the game. */
  isOnFox: boolean;
}
