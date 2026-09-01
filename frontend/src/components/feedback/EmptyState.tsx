import styles from './feedback.module.css';

interface EmptyStateProps {
  league: string;
  /** No games matched the FOX filter (there may still be games in the league). */
  foxOnly?: boolean;
}

export function EmptyState({ league, foxOnly }: EmptyStateProps) {
  return (
    <div className={styles.panel}>
      <BallIcon />
      {foxOnly ? (
        <>
          <p className={styles.title}>No {league} games on FOX today</p>
          <p className={styles.message}>
            Turn off the “On FOX” filter to see the rest of today’s slate.
          </p>
        </>
      ) : (
        <>
          <p className={styles.title}>No {league} games today</p>
          <p className={styles.message}>
            Check back on game day, or switch to another league above.
          </p>
        </>
      )}
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
