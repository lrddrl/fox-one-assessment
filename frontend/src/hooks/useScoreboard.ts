import { useCallback, useEffect, useRef, useState } from 'react';

import { getLeague } from '../config/leagues';
import { fetchScoreboard, ScoreboardError } from '../lib/espn';
import type { Game } from '../types';

const POLL_INTERVAL_MS = 30_000;

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
 * Loads one league's scoreboard: the initial fetch, the 30s poll, manual
 * refresh, and cancellation.
 *
 * `fetch` in an effect, no data-fetching library — the brief asks for minimal
 * dependencies and this reads top to bottom. One `AbortController` per request
 * means switching leagues cancels the in-flight call, so a slow MLB response
 * can't land after you've moved to NFL.
 */
export function useScoreboard(
  leagueId: string,
  autoRefresh: boolean,
): ScoreboardModel {
  const [state, setState] = useState<State>(LOADING);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(
    async (isBackground: boolean) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (isBackground) {
        setState((prev) => ({ ...prev, isRefreshing: true }));
      }

      try {
        const games = await fetchScoreboard(
          getLeague(leagueId),
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setState({
          games,
          status: 'ready',
          error: null,
          lastUpdated: Date.now(),
          isRefreshing: false,
        });
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
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
          isRefreshing: false,
        }));
      }
    },
    [leagueId],
  );

  // Fetch on mount and whenever the league changes. Resetting to LOADING first
  // clears the previous league's games so they don't flash during the fetch —
  // this whole effect is "synchronise the UI with the selected league".
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    setState(LOADING);
    void load(false);
    return () => abortRef.current?.abort();
  }, [load]);

  // Poll while auto-refresh is on.
  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(() => void load(true), POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [autoRefresh, load]);

  return {
    ...state,
    refresh: () => void load(true),
  };
}
