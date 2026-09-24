import { describe, expect, test } from 'bun:test';

import { horizonLabel, isHorizon } from '../src/lib/horizons';

describe('isHorizon', () => {
  test('accepts a horizon the API knows', () => {
    expect(isHorizon('SINCE_TRADE')).toBe(true);
  });

  test('rejects a stale or hand-edited stored value', () => {
    expect(isHorizon('WEEK')).toBe(false);
  });
});

describe('horizonLabel', () => {
  test('uses the short label shown on the toggle', () => {
    expect(horizonLabel('SINCE_TRADE')).toBe('Trade');
  });
});
