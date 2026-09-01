import { useRelativeTime } from '../hooks/useRelativeTime';
import styles from './ScoreboardToolbar.module.css';

interface ScoreboardToolbarProps {
  gameCount: number;
  /** Games in the league before the FOX filter — for the "3 of 12" label. */
  totalCount: number;
  lastUpdated: number | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  disabled: boolean;
  foxOnly: boolean;
  onToggleFox: () => void;
}

export function ScoreboardToolbar({
  gameCount,
  totalCount,
  lastUpdated,
  isRefreshing,
  onRefresh,
  disabled,
  foxOnly,
  onToggleFox,
}: ScoreboardToolbarProps) {
  const updatedLabel = useRelativeTime(lastUpdated);

  return (
    <div className={styles.bar}>
      <p className={styles.count}>
        {totalCount === 0 ? (
          'No games'
        ) : foxOnly ? (
          <>
            <strong>{gameCount}</strong> of {totalCount} on FOX
          </>
        ) : (
          <>
            <strong>{gameCount}</strong> {gameCount === 1 ? 'game' : 'games'}
          </>
        )}
      </p>

      <div className={styles.controls}>
        <button
          type="button"
          className={`${styles.foxToggle} ${foxOnly ? styles.foxToggleOn : ''}`}
          onClick={onToggleFox}
          aria-pressed={foxOnly}
        >
          On FOX
        </button>

        {updatedLabel ? (
          <span className={styles.updated}>
            {isRefreshing ? 'Refreshing…' : `Updated ${updatedLabel}`}
          </span>
        ) : null}

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
