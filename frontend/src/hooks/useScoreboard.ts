import { useCallback, useEffect, useRef, useState } from 'react';

import { getLeague } from '../config/leagues';
import { fetchScoreboard, ScoreboardError } from '../lib/espn';
import type { Game } from '../types';

/** How often to re-poll when auto-refresh is on. */
const POLL_INTERVAL_MS = 30_000;

export type ScoreboardStatus = 'loading' | 'ready' | 'error';

export interface ScoreboardModel {
  games: Game[];
  status: ScoreboardStatus;
  /**
   * A problem message to surface. Present on a failed first load
   * (status === 'error') and on a failed background refresh (status stays
   * 'ready' with the last good games, and the UI shows a "may be stale" note).
   */
  error: string | null;
  lastUpdated: number | null;
  isRefreshing: boolean;
  refresh: () => void;
}

interface InternalState {
  games: Game[];
  /** The league whose games are currently in `games` — null until first load. */
  loadedLeagueId: string | null;
  error: string | null;
  lastUpdated: number | null;
  isRefreshing: boolean;
}

const INITIAL: InternalState = {
  games: [],
  loadedLeagueId: null,
  error: null,
  lastUpdated: null,
  isRefreshing: false,
};

/**
 * Owns everything about loading one league's scoreboard: the initial fetch, the
 * polling timer, manual refresh, and cancellation.
 *
 * Design notes
 * ------------
 * - Plain `fetch` in a `useEffect`, not a data-fetching library. The brief asks
 *   for minimal dependencies and this reads end to end. TanStack Query / SWR
 *   would add caching and request dedupe for free and is the natural next step
 *   if the app grew.
 * - One `AbortController` per request: switching leagues cancels the in-flight
 *   call, so a slow MLB response can't land after you've moved to NFL.
 * - `status` is *derived*: if the loaded league doesn't match the requested one
 *   we're 'loading'. That avoids resetting state from inside an effect when the
 *   league changes.
 * - Polling lives in its own effect keyed on `autoRefresh`, so toggling it just
 *   starts/stops the timer.
 */
export function useScoreboard(
  leagueId: string,
  autoRefresh: boolean,
): ScoreboardModel {
  const [state, setState] = useState<InternalState>(INITIAL);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(
    async (opts?: { background?: boolean }) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // Only the manual button and the poll timer show a "refreshing"
      // affordance; the first load already renders skeletons.
      if (opts?.background) {
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
          loadedLeagueId: leagueId,
          error: null,
          lastUpdated: Date.now(),
          isRefreshing: false,
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        if (error instanceof DOMException && error.name === 'AbortError') return;
        const message =
          error instanceof ScoreboardError
            ? error.message
            : 'Something went wrong loading the scoreboard.';
        setState((prev) => ({
          ...prev,
          // Mark this league "seen" so a first-load failure shows the error
          // screen rather than an endless skeleton.
          loadedLeagueId: prev.loadedLeagueId ?? leagueId,
          error: message,
          isRefreshing: false,
        }));
      }
    },
    [leagueId],
  );

  // Fetch on mount and whenever the league changes (`load` changes with it).
  // Loading from a remote API is the textbook "synchronize with an external
  // system" use of an effect. The lint rule flags it because `load` contains
  // setState calls, but they are all past an `await`, not synchronous here.
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void load();
    return () => abortRef.current?.abort();
  }, [load]);

  // Polling timer.
  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(
      () => void load({ background: true }),
      POLL_INTERVAL_MS,
    );
    return () => window.clearInterval(id);
  }, [autoRefresh, load]);

  const refresh = useCallback(() => void load({ background: true }), [load]);

  const isCurrentLeagueLoaded = state.loadedLeagueId === leagueId;
  const status: ScoreboardStatus = !isCurrentLeagueLoaded
    ? 'loading'
    : state.error && state.games.length === 0
      ? 'error'
      : 'ready';

  return {
    // While a new league loads, don't leak the previous league's games.
    games: isCurrentLeagueLoaded ? state.games : [],
    status,
    error: status === 'loading' ? null : state.error,
    lastUpdated: isCurrentLeagueLoaded ? state.lastUpdated : null,
    isRefreshing: state.isRefreshing,
    refresh,
  };
}
