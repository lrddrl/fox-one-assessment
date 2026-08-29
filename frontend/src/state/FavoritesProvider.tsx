import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  FAVORITES_STORAGE_KEY,
  FavoritesContext,
  type FavoritesModel,
} from './favorites';

/**
 * Favorite teams, persisted to `localStorage`.
 *
 * Why Context rather than props: a star sits on every `TeamRow` — three levels
 * below `App` — and those leaves both *read* (is this team starred?) and
 * *write* (toggle it). Threading a favorites object through `GameList` and
 * `GameCard`, neither of which cares about it, is exactly the prop-drilling
 * Context exists to avoid. It is still plain React: no state-management
 * library, and the whole store is one `Set` of strings.
 *
 * A `Set` is the right shape here — membership is the only question asked of
 * it, lookups are O(1), and it de-duplicates for free.
 */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Set<string>>(readStoredFavorites);

  useEffect(() => {
    try {
      localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify([...favorites]),
      );
    } catch {
      // Storage can be unavailable (private mode, blocked cookies). Favorites
      // still work for this session, they just won't be remembered.
    }
  }, [favorites]);

  const toggle = useCallback((key: string) => {
    setFavorites((current) => {
      // Copy rather than mutate, so React sees a new reference and re-renders.
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const value = useMemo<FavoritesModel>(
    () => ({
      isFavorite: (key) => favorites.has(key),
      toggle,
      count: favorites.size,
    }),
    [favorites, toggle],
  );

  // React 19 lets a context object be the provider directly — no `.Provider`.
  return <FavoritesContext value={value}>{children}</FavoritesContext>;
}

function readStoredFavorites(): Set<string> {
  try {
    const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!saved) return new Set();
    const parsed: unknown = JSON.parse(saved);
    // Guard against a corrupted or hand-edited value rather than trusting it.
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((entry) => typeof entry === 'string'));
  } catch {
    // Unreadable storage or malformed JSON — start empty rather than crash.
    return new Set();
  }
}
