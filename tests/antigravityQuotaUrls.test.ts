import { describe, expect, test } from 'bun:test';
import { ANTIGRAVITY_QUOTA_URLS, ANTIGRAVITY_REQUEST_HEADERS } from '@/utils/quota/constants';

describe('ANTIGRAVITY_QUOTA_URLS', () => {
  test('prioritizes the daily endpoint used for Antigravity generation', () => {
    expect(ANTIGRAVITY_QUOTA_URLS[0]).toBe(
      'https://daily-cloudcode-pa.googleapis.com/v1internal:retrieveUserQuotaSummary'
    );
    expect(ANTIGRAVITY_QUOTA_URLS).toEqual([
      'https://daily-cloudcode-pa.googleapis.com/v1internal:retrieveUserQuotaSummary',
      'https://cloudcode-pa.googleapis.com/v1internal:retrieveUserQuotaSummary',
      'https://daily-cloudcode-pa.sandbox.googleapis.com/v1internal:retrieveUserQuotaSummary',
    ]);
  });
});

describe('Antigravity quota request identity', () => {
  test('uses the client version verified to return Gemini quota on daily', () => {
    // Same account and project: 1.0.13 omits Gemini, while 2.24.0 matches the client.
    expect(ANTIGRAVITY_REQUEST_HEADERS['User-Agent']).toBe(
      'antigravity/cli/2.24.0 (aidev_client; os_type=darwin; arch=arm64)'
    );
  });
});
