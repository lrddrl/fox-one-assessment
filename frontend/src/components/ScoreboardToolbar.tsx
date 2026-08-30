import { useRelativeTime } from '../hooks/useRelativeTime';
import styles from './ScoreboardToolbar.module.css';

interface ScoreboardToolbarProps {
  gameCount: number;
  lastUpdated: number | null;
  isRefreshing: boolean;
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
  onRefresh: () => void;
  disabled: boolean;
}

export function ScoreboardToolbar({
  gameCount,
  lastUpdated,
  isRefreshing,
  autoRefresh,
  onToggleAutoRefresh,
  onRefresh,
  disabled,
}: ScoreboardToolbarProps) {
  const updatedLabel = useRelativeTime(lastUpdated);

  return (
    <div className={styles.bar}>
      <p className={styles.count}>
        {gameCount === 0 ? (
          'No games'
        ) : (
          <>
            <strong>{gameCount}</strong> {gameCount === 1 ? 'game' : 'games'}
          </>
        )}
      </p>

      <div className={styles.controls}>
        {updatedLabel ? (
          <span className={styles.updated}>
            {isRefreshing ? 'Refreshing…' : `Updated ${updatedLabel}`}
          </span>
        ) : null}

        <label className={styles.auto}>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={onToggleAutoRefresh}
          />
          <span className={styles.track} aria-hidden="true">
            <span className={styles.thumb} />
          </span>
          Auto
        </label>

        <button
          type="button"
          className={styles.refresh}
          onClick={onRefresh}
          disabled={disabled || isRefreshing}
          aria-label="Refresh now"
        >
          <RefreshIcon spinning={isRefreshing} />
        </button>
      </div>
    </div>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      className={spinning ? styles.spin : undefined}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <polyline points="21 3 21 9 15 9" />
    </svg>
  );
}
