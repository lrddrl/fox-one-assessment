import type { ScoreboardStatus } from '../hooks/useScoreboard';
import type { Game } from '../types';
import { EmptyState } from './feedback/EmptyState';
import { ErrorPanel } from './feedback/ErrorPanel';
import { SkeletonCard } from './feedback/SkeletonCard';
import { GameCard } from './GameCard';
import styles from './GameList.module.css';

interface GameListProps {
  status: ScoreboardStatus;
  /** Games after filtering — exactly what should render. */
  games: Game[];
  /** Games before filtering, to tell "nothing today" from "filtered to zero". */
  totalGames: number;
  error: string | null;
  leagueLabel: string;
  onRetry: () => void;
  onClearFilters: () => void;
}

const SKELETON_COUNT = 6;

export function GameList({
  status,
  games,
  totalGames,
  error,
  leagueLabel,
  onRetry,
  onClearFilters,
}: GameListProps) {
  if (status === 'loading') {
    return (
      <div className={styles.grid}>
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={styles.grid}>
        <ErrorPanel message={error ?? 'Please try again.'} onRetry={onRetry} />
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className={styles.grid}>
        <EmptyState
          league={leagueLabel}
          // Only offer "clear filters" when filters are what emptied the list.
          onClearFilters={totalGames > 0 ? onClearFilters : undefined}
        />
      </div>
    );
  }

  return (
    <>
      {/* A refresh failed but we still have data to show. */}
      {error ? (
        <p className={styles.staleBanner} role="status">
          {error} Showing the last available scores.
        </p>
      ) : null}

      <div className={styles.grid}>
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </>
  );
}
