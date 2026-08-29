/** Small, pure formatting helpers. Kept together so they're easy to unit-test. */

/**
 * Format a start time relative to "now": "Today 7:40 PM", "Tomorrow 1:00 PM",
 * or "Sat 4:05 PM" for anything further out. Uses the visitor's locale/timezone.
 */
export function formatStartTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const time = date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (isSameDay(date, now)) return `Today ${time}`;

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (isSameDay(date, tomorrow)) return `Tomorrow ${time}`;

  const weekday = date.toLocaleDateString([], { weekday: 'short' });
  return `${weekday} ${time}`;
}

/** "just now", "12s ago", "4m ago", "2h ago" — for the "last updated" label. */
export function formatRelativeTime(from: number, to: number = Date.now()): string {
  const seconds = Math.max(0, Math.round((to - from) / 1000));
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
