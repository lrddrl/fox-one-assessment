import styles from './feedback.module.css';

interface EmptyStateProps {
  league: string;
  /**
   * Present when the list is empty because filters hid everything, rather than
   * because there are no games today — so we can offer a way out instead of a
   * dead end.
   */
  onClearFilters?: () => void;
}

export function EmptyState({ league, onClearFilters }: EmptyStateProps) {
  if (onClearFilters) {
    return (
      <div className={styles.panel}>
        <FilterIcon />
        <p className={styles.title}>No games match your filters</p>
        <p className={styles.message}>
          There are {league} games today, but none of them fit. Try turning a
          filter off.
        </p>
        <button type="button" className={styles.retry} onClick={onClearFilters}>
          Clear filters
        </button>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <BallIcon />
      <p className={styles.title}>No {league} games today</p>
      <p className={styles.message}>
        Check back on game day, or switch to another league above.
      </p>
    </div>
  );
}

function BallIcon() {
  return (
    <svg className={styles.icon} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 15s1.5-2 4-2 4 2 4 2M9 9h.01M15 9h.01" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg className={styles.icon} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 5h18l-7 8v6l-4 2v-8L3 5z" />
    </svg>
  );
}
