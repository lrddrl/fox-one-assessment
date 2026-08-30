import type { ScoreboardStatus } from '../hooks/useScoreboard';
import type { Game } from '../types';
import { EmptyState } from './feedback/EmptyState';
import { ErrorPanel } from './feedback/ErrorPanel';
import { SkeletonCard } from './feedback/SkeletonCard';
import { GameCard } from './GameCard';
import styles from './GameList.module.css';

interface GameListProps {
  status: ScoreboardStatus;
  games: Game[];
  error: string | null;
  leagueLabel: string;
  onRetry: () => void;
}

const SKELETON_COUNT = 6;

export function GameList({
  status,
  games,
  error,
  leagueLabel,
  onRetry,
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
        <EmptyState league={leagueLabel} />
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
