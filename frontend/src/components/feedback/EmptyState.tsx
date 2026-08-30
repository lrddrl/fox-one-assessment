import styles from './feedback.module.css';

interface EmptyStateProps {
  league: string;
}

export function EmptyState({ league }: EmptyStateProps) {
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
