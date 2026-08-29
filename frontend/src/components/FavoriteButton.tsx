import styles from './FavoriteButton.module.css';

interface FavoriteButtonProps {
  active: boolean;
  /** Used in the accessible label so screen readers hear which team. */
  teamName: string;
  onToggle: () => void;
}

/** The star on a team row. Presentational — the parent owns the state. */
export function FavoriteButton({
  active,
  teamName,
  onToggle,
}: FavoriteButtonProps) {
  const label = active
    ? `Remove ${teamName} from favorites`
    : `Add ${teamName} to favorites`;

  return (
    <button
      type="button"
      className={`${styles.button} ${active ? styles.active : ''}`}
      onClick={onToggle}
      aria-pressed={active}
      aria-label={label}
      title={label}
    >
      <StarIcon filled={active} />
    </button>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2.6l2.85 6.2 6.75.75-5.03 4.6 1.38 6.65L12 17.5l-5.95 3.3 1.38-6.65-5.03-4.6 6.75-.75L12 2.6z" />
    </svg>
  );
}
