import type { UsageRange } from './types';

export const USAGE_PAGE_SIZE = 50;

export const USAGE_RANGES: readonly UsageRange[] = ['24h', '7d'];

/** 2-column preset grid, row-major: today/yesterday, 24h/7d, 14d/30d, this_month/last_month. */
export const USAGE_RANGE_PRESETS: readonly UsageRange[] = [
  'today',
  'yesterday',
  '24h',
  '7d',
  '14d',
  '30d',
  'this_month',
  'last_month',
];

/** Maximum inclusive span (in days) allowed for a custom range. */
export const USAGE_MAX_RANGE_DAYS = 90;
/** How many days of usage history are retained; custom ranges cannot start before this. */
export const USAGE_RETENTION_DAYS = 90;
/** Custom ranges spanning at most this many days use hourly buckets; longer ranges use daily. */
export const USAGE_HOUR_STEP_MAX_DAYS = 2;
