import type { ReactNode } from 'react';

import styles from './FilterChip.module.css';

interface FilterChipProps {
  label: string;
  active: boolean;
  onToggle: () => void;
  /** Rendered before the label — a small icon. */
  icon?: ReactNode;
  disabled?: boolean;
  /** Tooltip; also the explanation when the chip is disabled. */
  title?: string;
}

/**
 * A toggle styled as a pill. It's a real `<button>` with `aria-pressed`, so it
 * announces its on/off state rather than reading as a link.
 */
export function FilterChip({
  label,
  active,
  onToggle,
  icon,
  disabled = false,
  title,
}: FilterChipProps) {
  return (
    <button
      type="button"
      className={`${styles.chip} ${active ? styles.active : ''}`}
      onClick={onToggle}
      aria-pressed={active}
      disabled={disabled}
      title={title}
    >
      {icon}
      {label}
    </button>
  );
}
