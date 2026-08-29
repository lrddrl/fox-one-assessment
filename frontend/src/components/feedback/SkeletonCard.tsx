import styles from './feedback.module.css';

/** Placeholder shown in the grid while the first load is in flight. */
export function SkeletonCard() {
  return <div className={styles.skeletonCard} aria-hidden="true" />;
}
