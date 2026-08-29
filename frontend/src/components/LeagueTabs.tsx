import { useRef } from 'react';

import { LEAGUES } from '../config/leagues';
import styles from './LeagueTabs.module.css';

interface LeagueTabsProps {
  activeId: string;
  onChange: (id: string) => void;
}

/**
 * League switcher, built as an ARIA tablist so it's keyboard-navigable
 * (arrow keys move between leagues, matching the WAI-ARIA tabs pattern).
 */
export function LeagueTabs({ activeId, onChange }: LeagueTabsProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusTab = (index: number) => {
    const clamped = (index + LEAGUES.length) % LEAGUES.length;
    tabRefs.current[clamped]?.focus();
    onChange(LEAGUES[clamped].id);
  };

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusTab(index + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusTab(index - 1);
    }
  };

  return (
    <div className={styles.tabs} role="tablist" aria-label="League">
      {LEAGUES.map((league, index) => {
        const selected = league.id === activeId;
        return (
          <button
            key={league.id}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            className={`${styles.tab} ${selected ? styles.active : ''}`}
            onClick={() => onChange(league.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            <span className={styles.full}>{league.label}</span>
            <span className={styles.short}>{league.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
