import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import {
  buildUsageRange,
  endOfLocalMonth,
  formatLocalOffsetISO,
  parseLocalDateInput,
  startOfLocalMonth,
  toLocalDateInput,
  validateCustomRange,
} from '@/features/usage/logic';
import { USAGE_RANGE_PRESETS } from '@/features/usage/constants';
import en from '@/i18n/locales/en.json';
import zhCN from '@/i18n/locales/zh-CN.json';
import zhTW from '@/i18n/locales/zh-TW.json';
import ru from '@/i18n/locales/ru.json';

// These tests assert local-offset (+08:00) output; bun test's default runner
// environment is UTC regardless of the host's actual timezone, so TZ must be
// set explicitly here. Scoped to this file only (restored in afterAll) since
// a bare top-level mutation leaks into other test files sharing this bun
// process (confirmed to break tests/quotaTimelineRendering.test.ts, which
// relies on the UTC default).
const ORIGINAL_TZ = process.env.TZ;
beforeAll(() => {
  process.env.TZ = 'Asia/Shanghai';
});
afterAll(() => {
  // bun test's own default (no TZ set) resolves to UTC, not the OS default;
  // deleting the key here would leave Asia/Shanghai in place for later tests.
  process.env.TZ = ORIGINAL_TZ === undefined ? 'UTC' : ORIGINAL_TZ;
});

describe('formatLocalOffsetISO', () => {
  test('formats a local Date with a +08:00 offset, never Z', () => {
    const d = new Date(2026, 8, 21, 0, 0, 0, 0); // 2026-09-21 local midnight
    expect(formatLocalOffsetISO(d)).toBe('2026-09-21T00:00:00.000+08:00');
  });
});

describe('calendar-anchored presets', () => {
  test('today clamps "to" to now and starts at local midnight', () => {
    const now = new Date(2026, 8, 21, 14, 30, 0, 0);
    const r = buildUsageRange('today', now);
    expect(r.from).toBe('2026-09-21T00:00:00.000+08:00');
    expect(r.to).toBe(formatLocalOffsetISO(now));
    expect(r.step).toBe('hour');
  });

  test('yesterday is a closed window (not clamped to now)', () => {
    const now = new Date(2026, 8, 21, 14, 30, 0, 0);
    const r = buildUsageRange('yesterday', now);
    expect(r.from).toBe('2026-09-20T00:00:00.000+08:00');
    expect(r.to).toBe('2026-09-20T23:59:59.999+08:00');
  });

  test('this_month starts at local month start and clamps to now', () => {
    const now = new Date(2026, 8, 21, 14, 30, 0, 0);
    const r = buildUsageRange('this_month', now);
    expect(r.from).toBe('2026-09-01T00:00:00.000+08:00');
    expect(r.to).toBe(formatLocalOffsetISO(now));
    expect(r.step).toBe('day');
  });

  test('last_month is a closed full-month window, including year rollover', () => {
    const now = new Date(2026, 8, 21, 14, 30, 0, 0); // September 2026
    const r = buildUsageRange('last_month', now);
    expect(r.from).toBe('2026-08-01T00:00:00.000+08:00');
    expect(r.to).toBe('2026-08-31T23:59:59.999+08:00');

    const jan = new Date(2026, 0, 15, 10, 0, 0, 0); // January 2026 -> last month is Dec 2025
    const rJan = buildUsageRange('last_month', jan);
    expect(rJan.from).toBe('2025-12-01T00:00:00.000+08:00');
    expect(rJan.to).toBe('2025-12-31T23:59:59.999+08:00');
  });

  test('endOfLocalMonth / startOfLocalMonth agree on February in a leap year', () => {
    const feb = new Date(2028, 1, 10);
    expect(startOfLocalMonth(feb).getDate()).toBe(1);
    expect(endOfLocalMonth(feb).getDate()).toBe(29);
  });
});

describe('custom range step selection and clamping', () => {
  test('a 1-day custom span uses hourly buckets', () => {
    const now = new Date(2026, 8, 21, 10, 0, 0, 0);
    const r = buildUsageRange('custom', now, { from: '2026-09-18', to: '2026-09-18' });
    expect(r.step).toBe('hour');
    expect(r.from).toBe('2026-09-18T00:00:00.000+08:00');
    expect(r.to).toBe('2026-09-18T23:59:59.999+08:00');
  });

  test('a 3-day custom span uses daily buckets', () => {
    const now = new Date(2026, 8, 21, 10, 0, 0, 0);
    const r = buildUsageRange('custom', now, { from: '2026-09-16', to: '2026-09-18' });
    expect(r.step).toBe('day');
  });

  test('custom range end clamps to now when the selected "to" day is today or later', () => {
    const now = new Date(2026, 8, 21, 10, 15, 0, 0);
    const r = buildUsageRange('custom', now, { from: '2026-09-21', to: '2026-09-21' });
    expect(r.to).toBe(formatLocalOffsetISO(now));
  });
});

describe('validateCustomRange', () => {
  const now = new Date(2026, 8, 21, 10, 0, 0, 0);

  test('flags from after to', () => {
    expect(validateCustomRange('2026-09-20', '2026-09-18', now)?.key).toBe('usage.range_invalid_order');
  });

  test('flags spans longer than the max range', () => {
    expect(validateCustomRange('2026-01-01', '2026-09-21', now)?.key).toBe('usage.range_too_long');
  });

  test('flags a start date before the retention window', () => {
    expect(validateCustomRange('2020-01-01', '2020-01-02', now)?.key).toBe('usage.range_before_retention');
  });

  test('accepts a valid in-window range', () => {
    expect(validateCustomRange('2026-09-18', '2026-09-20', now)).toBeNull();
  });
});

describe('date-input round trip', () => {
  test('toLocalDateInput / parseLocalDateInput round-trip a local date', () => {
    const input = '2026-09-21';
    const parsed = parseLocalDateInput(input);
    expect(toLocalDateInput(parsed)).toBe(input);
  });
});

describe('usage range i18n parity', () => {
  test('all 9 range keys plus custom-range copy exist and differ per locale', () => {
    const rangeKeys = USAGE_RANGE_PRESETS.map((r) => `range_${r}`).concat(['range_custom']);
    const extraKeys = [
      'custom_from',
      'custom_to',
      'custom_apply',
      'range_invalid_order',
      'range_too_long',
      'range_before_retention',
      'range_hint_step',
    ];

    for (const locale of [en, zhCN, zhTW, ru]) {
      const usage = locale.usage as Record<string, string>;
      for (const key of [...rangeKeys, ...extraKeys]) {
        expect(usage[key]?.trim()).toBeTruthy();
      }
    }

    // zh-CN / zh-TW / ru must each have their own translation, not a copy of en.
    // (zh-CN and zh-TW may legitimately share identical short words like "今天"/"昨天".)
    for (const key of rangeKeys) {
      const enValue = (en.usage as Record<string, string>)[key];
      expect((zhCN.usage as Record<string, string>)[key]).not.toBe(enValue);
      expect((zhTW.usage as Record<string, string>)[key]).not.toBe(enValue);
      expect((ru.usage as Record<string, string>)[key]).not.toBe(enValue);
    }
  });
});
