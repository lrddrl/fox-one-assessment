/**
 * The leagues the app can show.
 *
 * Scoped to what FOX broadcasts: NFL (NFC package + playoffs), MLB (Saturday
 * Game of the Week, the World Series), and college football (Big Ten / Big 12
 * on FOX). Adding a league is a one-line change here — the rest of the app is
 * driven off this list.
 */

export interface LeagueConfig {
  /** Stable id used in app state and as a React key. */
  id: string;
  label: string;
  shortLabel: string;
  /** Path segment for ESPN's site API, e.g. "baseball/mlb". */
  espnPath: string;
}

export const LEAGUES: readonly LeagueConfig[] = [
  { id: 'mlb', label: 'MLB', shortLabel: 'MLB', espnPath: 'baseball/mlb' },
  { id: 'nfl', label: 'NFL', shortLabel: 'NFL', espnPath: 'football/nfl' },
  {
    id: 'college-football',
    label: 'College Football',
    shortLabel: 'CFB',
    espnPath: 'football/college-football',
  },
];

export const DEFAULT_LEAGUE_ID = 'mlb';
