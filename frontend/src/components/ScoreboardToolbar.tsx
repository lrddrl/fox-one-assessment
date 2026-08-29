import { useRelativeTime } from '../hooks/useRelativeTime';
import { FilterChip } from './FilterChip';
import styles from './ScoreboardToolbar.module.css';

/** Which filters are on. Owned by `App`, applied before the list renders. */
export interface Filters {
  foxOnly: boolean;
  favoritesOnly: boolean;
}

interface ScoreboardToolbarProps {
  /** Games after filtering — what the user can currently see. */
  visibleCount: number;
  /** Games before filtering, so we can say "6 of 15". */
  totalCount: number;
  filters: Filters;
  onToggleFilter: (key: keyof Filters) => void;
  /** Favorited teams across all leagues; 0 disables the favorites chip. */
  favoriteCount: number;
  lastUpdated: number | null;
  isRefreshing: boolean;
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
  onRefresh: () => void;
  disabled: boolean;
}

export function ScoreboardToolbar({
  visibleCount,
  totalCount,
  filters,
  onToggleFilter,
  favoriteCount,
  lastUpdated,
  isRefreshing,
  autoRefresh,
  onToggleAutoRefresh,
  onRefresh,
  disabled,
}: ScoreboardToolbarProps) {
  const updatedLabel = useRelativeTime(lastUpdated);
  const isFiltered = filters.foxOnly || filters.favoritesOnly;

  return (
    <div className={styles.bar}>
      <div className={styles.left}>
        <p className={styles.count}>
          {totalCount === 0 ? (
            'No games'
          ) : isFiltered ? (
            <>
              <strong>{visibleCount}</strong> of {totalCount}
            </>
          ) : (
            <>
              <strong>{totalCount}</strong>{' '}
              {totalCount === 1 ? 'game' : 'games'}
            </>
          )}
        </p>

        <FilterChip
          label="On FOX"
          active={filters.foxOnly}
          onToggle={() => onToggleFilter('foxOnly')}
          title="Only games carried by FOX, FS1, FS2, or FOX Deportes"
        />
        <FilterChip
          label="Favorites"
          active={filters.favoritesOnly}
          onToggle={() => onToggleFilter('favoritesOnly')}
          icon={<StarIcon />}
          disabled={favoriteCount === 0}
          title={
            favoriteCount === 0
              ? 'Star a team to use this filter'
              : `Only games involving your ${favoriteCount} starred ${
                  favoriteCount === 1 ? 'team' : 'teams'
                }`
          }
        />
      </div>

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

function StarIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2.6l2.85 6.2 6.75.75-5.03 4.6 1.38 6.65L12 17.5l-5.95 3.3 1.38-6.65-5.03-4.6 6.75-.75L12 2.6z" />
    </svg>
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
