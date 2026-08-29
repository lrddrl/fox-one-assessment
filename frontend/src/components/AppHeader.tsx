import { ThemeToggle } from './ThemeToggle';
import styles from './AppHeader.module.css';

export function AppHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Mark />
          <div className={styles.titleGroup}>
            <span className={styles.title}>Scoreboard</span>
            <span className={styles.tagline}>
              Live scores from the leagues FOX carries
            </span>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}

/** Abstract broadcast mark — three angled bars. Not the FOX logo. */
function Mark() {
  return (
    <svg
      className={styles.mark}
      width="30"
      height="30"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <rect x="3" y="6" width="7" height="20" rx="2" transform="skewX(-12)" fill="var(--brand)" />
      <rect x="13" y="6" width="7" height="20" rx="2" transform="skewX(-12)" fill="var(--text)" opacity="0.85" />
      <rect x="23" y="6" width="7" height="20" rx="2" transform="skewX(-12)" fill="var(--brand)" opacity="0.5" />
    </svg>
  );
}
