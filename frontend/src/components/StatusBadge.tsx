import type { GameState } from '../types';
import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  state: GameState;
  /** e.g. "Final", "Top 5th", "Today 7:40 PM". */
  detail: string;
}

/**
 * The pill at the top of a game card. Pure presentational: the caller decides
 * what `detail` says, this just picks the treatment for the state.
 */
export function StatusBadge({ state, detail }: StatusBadgeProps) {
  if (state === 'in') {
    return (
      <span className={`${styles.badge} ${styles.live}`}>
        <span className={styles.pulse} aria-hidden="true" />
        <span className={styles.liveLabel}>Live</span>
        <span className={styles.detail}>{detail}</span>
      </span>
    );
  }

  if (state === 'post') {
    return (
      <span className={`${styles.badge} ${styles.final}`}>
        {detail || 'Final'}
      </span>
    );
  }

  return <span className={`${styles.badge} ${styles.upcoming}`}>{detail}</span>;
}
