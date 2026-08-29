import { useState } from 'react';

import { teamKey, useFavorites } from '../state/favorites';
import type { GameState, TeamSide } from '../types';
import { FavoriteButton } from './FavoriteButton';
import styles from './TeamRow.module.css';

interface TeamRowProps {
  team: TeamSide;
  /** Which league this team is in — favorites are keyed per league. */
  leagueLabel: string;
  gameState: GameState;
  /** Dim the losing side once a game is final. */
  dim: boolean;
}

export function TeamRow({ team, leagueLabel, gameState, dim }: TeamRowProps) {
  const { isFavorite, toggle } = useFavorites();
  const key = teamKey(leagueLabel, team.id);

  return (
    <div className={`${styles.row} ${dim ? styles.dim : ''}`}>
      <TeamLogo url={team.logoUrl} name={team.displayName} />

      <div className={styles.identity}>
        <span className={styles.name}>
          {team.rank ? <sup className={styles.rank}>{team.rank}</sup> : null}
          {team.shortName}
        </span>
        {team.record ? (
          <span className={styles.record}>{team.record}</span>
        ) : null}
      </div>

      <span className={styles.score}>
        {gameState === 'pre' || team.score == null ? (
          <span className={styles.noScore}>--</span>
        ) : (
          team.score
        )}
      </span>

      {team.isWinner && gameState === 'post' ? (
        <span className={styles.winnerTick} aria-label="Winner">
          &#9654;
        </span>
      ) : (
        <span className={styles.winnerSpacer} aria-hidden="true" />
      )}

      <FavoriteButton
        active={isFavorite(key)}
        teamName={team.displayName}
        onToggle={() => toggle(key)}
      />
    </div>
  );
}

/** Team logos occasionally 404 on ESPN's CDN — fall back to initials. */
function TeamLogo({ url, name }: { url: string | null; name: string }) {
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    return (
      <span className={styles.logoFallback} aria-hidden="true">
        {name.slice(0, 1)}
      </span>
    );
  }

  return (
    <img
      className={styles.logo}
      src={url}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
