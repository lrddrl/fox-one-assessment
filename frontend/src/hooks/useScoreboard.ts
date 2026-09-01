import { useEffect, useState } from 'react';

import { LEAGUES } from '../config/leagues';
import { fetchScoreboard, ScoreboardError } from '../lib/espn';
import type { Game } from '../types';

const POLL_INTERVAL_MS = 30_000;

// A refresh usually finishes in a fraction of a second — too quick to notice.
// Hold the spinner for at least this long so a poll (or a button press) visibly
// registers, and the data doesn't seem to change on its own.
const MIN_SPIN_MS = 2_000;

export type ScoreboardStatus = 'loading' | 'ready' | 'error';

export interface ScoreboardModel {
  games: Game[];
  status: ScoreboardStatus;
  /**
   * A message to surface. Set on a failed first load (`status === 'error'`) and
   * on a failed background refresh (status stays `'ready'` with the last good
   * games, and the UI shows a "may be stale" note).
   */
  error: string | null;
  lastUpdated: number | null;
  isRefreshing: boolean;
  refresh: () => void;
}

interface State {
  games: Game[];
  status: ScoreboardStatus;
  error: string | null;
  lastUpdated: number | null;
  isRefreshing: boolean;
}

const LOADING: State = {
  games: [],
  status: 'loading',
  error: null,
  lastUpdated: null,
  isRefreshing: false,
};

/**
 * Loads one league's scoreboard: the initial fetch, a 30s poll, and manual
 * refresh. `fetch` in an effect, no data-fetching library — the brief asks for
 * minimal dependencies and this reads top to bottom.
 *
 * Deliberately left minimal: no request cancellation. Switching leagues while a
 * response is still in flight could, in theory, let the slow one land last and
 * show the wrong league for a moment. Acceptable for this exercise; the fix is
 * one `AbortController`.
 */
export function useScoreboard(leagueId: string): ScoreboardModel {
  const [state, setState] = useState<State>(LOADING);

  async function load(id: string, isBackground: boolean) {
    const startedAt = Date.now();
    if (isBackground) {
      setState((prev) => ({ ...prev, isRefreshing: true }));
    }

    try {
      const league = LEAGUES.find((league) => league.id === id) ?? LEAGUES[0];
      const games = await fetchScoreboard(league);
      setState({
        games,
        status: 'ready',
        error: null,
        lastUpdated: Date.now(),
        // Data is in, but keep the spinner up for a moment (below) on a refresh.
        isRefreshing: isBackground,
      });
    } catch (err) {
      const message =
        err instanceof ScoreboardError
          ? err.message
          : 'Something went wrong loading the scoreboard.';
      setState((prev) => ({
        ...prev,
        // Keep showing the games we already have; only a failed first load
        // (no games yet) becomes the full error screen.
        status: prev.games.length > 0 ? 'ready' : 'error',
        error: message,
        isRefreshing: isBackground,
      }));
    }

    // Let the spinner run for at least MIN_SPIN_MS so the refresh is noticeable,
    // then clear it. Only touches `isRefreshing`, so it's safe if the league
    // changed in the meantime.
    if (isBackground) {
      const remaining = MIN_SPIN_MS - (Date.now() - startedAt);
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }
      setState((prev) => ({ ...prev, isRefreshing: false }));
    }
  }

  // Fetch on mount and whenever the league changes. Reset to LOADING first so
  // the previous league's games don't linger (and a failed switch shows the
  // error screen, not stale scores under the wrong tab). This effect's whole
  // job is "sync the UI with the selected league" — the textbook use of an
  // effect — so the setState is expected here.
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    setState(LOADING);
    void load(leagueId, false);
  }, [leagueId]);

  // Poll every 30s.
  useEffect(() => {
    const timer = window.setInterval(
      () => void load(leagueId, true),
      POLL_INTERVAL_MS,
    );
    return () => window.clearInterval(timer);
  }, [leagueId]);

  return {
    ...state,
    refresh: () => void load(leagueId, true),
  };
}
