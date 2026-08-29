import { useEffect, useState } from 'react';

import { formatRelativeTime } from '../lib/format';

/**
 * Returns a live-updating "x ago" string for the given timestamp, re-rendering
 * on an interval so the label stays current without the parent re-rendering.
 *
 * @param timestamp epoch ms, or null to render nothing
 * @param everyMs   how often to recompute (default 10s)
 */
export function useRelativeTime(
  timestamp: number | null,
  everyMs = 10_000,
): string {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (timestamp == null) return;
    const id = window.setInterval(() => setTick((t) => t + 1), everyMs);
    return () => window.clearInterval(id);
  }, [timestamp, everyMs]);

  return timestamp == null ? '' : formatRelativeTime(timestamp);
}
