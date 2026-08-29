import { useCallback, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'scoreboard:theme';

/**
 * Light/dark theme with persistence.
 *
 * Resolution order for the initial value:
 *   1. a previous choice saved in localStorage
 *   2. the OS `prefers-color-scheme`
 *   3. dark (the app's default look)
 *
 * The chosen theme is written to `<html data-theme>`, which drives the token
 * override in index.css.
 */
export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(resolveInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage can be unavailable (private mode, blocked cookies) — the theme
      // still applies for this session, it just won't be remembered.
    }
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggle };
}

function resolveInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // ignore and fall through to the system preference
  }
  const prefersLight =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: light)').matches;
  return prefersLight ? 'light' : 'dark';
}
