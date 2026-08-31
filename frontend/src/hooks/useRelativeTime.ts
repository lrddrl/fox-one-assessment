import { useEffect, useState } from 'react';

import { formatRelativeTime } from '../lib/format';

/**
 * A live "x ago" string for the given timestamp. Holds the current time in
 * state and bumps it every 10s, so the label stays current on its own.
 *
 * @param timestamp epoch ms, or null to render nothing
 */
export function useRelativeTime(timestamp: number | null): string {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 10_000);
    return () => window.clearInterval(id);
  }, []);

  return timestamp == null ? '' : formatRelativeTime(timestamp, now);
}
