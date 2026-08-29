import { createContext, useContext } from 'react';

import type { Game } from '../types';

/** localStorage key holding the favorited team keys as a JSON array. */
export const FAVORITES_STORAGE_KEY = 'scoreboard:favorites';

/**
 * ESPN team ids are only unique *within* a league — id 30 is a different team
 * in MLB than in college football — so a favorite is keyed by league + team.
 */
export function teamKey(leagueLabel: string, teamId: string): string {
  return `${leagueLabel}:${teamId}`;
}

/** True when either side of this game is a favorited team. */
export function gameHasFavorite(
  game: Game,
  isFavorite: (key: string) => boolean,
): boolean {
  return (
    isFavorite(teamKey(game.leagueLabel, game.home.id)) ||
    isFavorite(teamKey(game.leagueLabel, game.away.id))
  );
}

export interface FavoritesModel {
  isFavorite: (key: string) => boolean;
  toggle: (key: string) => void;
  /** How many teams are favorited, across every league. */
  count: number;
}

/** Null until a `<FavoritesProvider>` supplies a value — see `useFavorites`. */
export const FavoritesContext = createContext<FavoritesModel | null>(null);

export function useFavorites(): FavoritesModel {
  const model = useContext(FavoritesContext);
  if (!model) {
    // A clear failure beats a confusing one: this only fires if a component is
    // rendered outside the provider, which is a wiring mistake, not user input.
    throw new Error('useFavorites must be used inside <FavoritesProvider>');
  }
  return model;
}
