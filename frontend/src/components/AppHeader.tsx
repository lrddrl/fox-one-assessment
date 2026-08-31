import { ThemeToggle } from './ThemeToggle';
import styles from './AppHeader.module.css';

export function AppHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          {/* Same file the browser tab uses (public/favicon.svg). */}
          <img className={styles.mark} src="/favicon.svg" alt="" width={28} height={28} />
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
