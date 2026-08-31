import { LEAGUES } from '../config/leagues';
import styles from './LeagueTabs.module.css';

interface LeagueTabsProps {
  activeId: string;
  onChange: (id: string) => void;
}

/** The league switcher — one button per league. */
export function LeagueTabs({ activeId, onChange }: LeagueTabsProps) {
  return (
    <div className={styles.tabs} role="tablist" aria-label="League">
      {LEAGUES.map((league) => {
        const selected = league.id === activeId;
        return (
          <button
            key={league.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`${styles.tab} ${selected ? styles.active : ''}`}
            onClick={() => onChange(league.id)}
          >
            <span className={styles.full}>{league.label}</span>
            <span className={styles.short}>{league.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
