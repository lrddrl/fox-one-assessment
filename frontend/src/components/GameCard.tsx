import { formatStartTime } from '../lib/format';
import type { Game } from '../types';
import { GameRecap } from './GameRecap';
import { StatusBadge } from './StatusBadge';
import { TeamRow } from './TeamRow';
import styles from './GameCard.module.css';

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  // Before a game starts the status line is a bare time; show a friendlier
  // "Today 7:40 PM" instead.
  const statusDetail =
    game.state === 'pre' ? formatStartTime(game.startTime) : game.statusDetail;

  // Once a game is final, dim whichever side lost.
  const loser: 'home' | 'away' | null =
    game.state === 'post'
      ? game.home.isWinner
        ? 'away'
        : game.away.isWinner
          ? 'home'
          : null
      : null;

  return (
    <article className={styles.card}>
      <header className={styles.head}>
        <StatusBadge state={game.state} detail={statusDetail} />
        {game.broadcast ? (
          <span
            className={`${styles.network} ${game.isOnFox ? styles.fox : ''}`}
          >
            {game.broadcast}
          </span>
        ) : null}
      </header>

      <div className={styles.teams}>
        <TeamRow team={game.away} gameState={game.state} dim={loser === 'away'} />
        <TeamRow team={game.home} gameState={game.state} dim={loser === 'home'} />
      </div>

      <footer className={styles.foot}>
        {game.venue ? <p className={styles.venue}>{game.venue}</p> : null}
        <GameRecap game={game} />
      </footer>
    </article>
  );
}
