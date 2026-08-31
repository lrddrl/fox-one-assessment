import { useState } from 'react';

import { fetchRecap, type RecapResult } from '../lib/recap';
import type { Game } from '../types';
import styles from './GameRecap.module.css';

/**
 * Recaps are cached for the page's lifetime, keyed by game id — re-opening a
 * card, or leaving a league and coming back, is then instant and spends no
 * quota. 5 minutes of staleness is a fine trade for a text blurb (the server
 * sets a matching `s-maxage`).
 */
const recapCache = new Map<string, RecapResult>();

export function GameRecap({ game }: { game: Game }) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<RecapResult | null>(
    () => recapCache.get(game.id) ?? null,
  );
  const [loading, setLoading] = useState(false);

  const label = game.state === 'pre' ? 'AI preview' : 'AI recap';

  async function load() {
    setLoading(true);
    const next = await fetchRecap(game);
    recapCache.set(game.id, next);
    setResult(next);
    setLoading(false);
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !result && !loading) void load();
  }

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.trigger}
        onClick={toggle}
        aria-expanded={open}
      >
        <SparkleIcon />
        {label}
        <ChevronIcon className={open ? styles.chevronOpen : styles.chevron} />
      </button>

      {open ? (
        <div
          className={styles.panel}
          role="region"
          aria-label={`${label} for this game`}
        >
          {loading ? <RecapSkeleton /> : null}

          {!loading && result?.status === 'ok' ? (
            <>
              <p className={styles.text}>{result.text}</p>
              <div className={styles.meta}>
                <span>AI-generated &middot; MiniMax &middot; may contain errors</span>
                <button
                  type="button"
                  className={styles.regen}
                  onClick={() => void load()}
                >
                  Regenerate
                </button>
              </div>
            </>
          ) : null}

          {!loading && result?.status === 'unconfigured' ? (
            <p className={styles.notice}>
              The AI recap runs on a serverless function. It's live on the
              deployed site; to run it locally, use <code>vercel dev</code> with{' '}
              <code>MINIMAX_API_KEY</code> set.
            </p>
          ) : null}

          {!loading && result?.status === 'error' ? (
            <div className={styles.notice}>
              <span>{result.message}</span>{' '}
              <button
                type="button"
                className={styles.regen}
                onClick={() => void load()}
              >
                Try again
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function RecapSkeleton() {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      <span style={{ width: '96%' }} />
      <span style={{ width: '88%' }} />
      <span style={{ width: '64%' }} />
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l1.9 5.1L19 9l-5.1 1.9L12 16l-1.9-5.1L5 9l5.1-1.9L12 2zm7 12l.9 2.4L22 19l-2.1.6L19 22l-.9-2.4L16 19l2.1-.6L19 14zM5 15l.75 2L8 17.75 6 18.5 5.25 21 4.5 18.5 2 17.75 4.25 17 5 15z" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
