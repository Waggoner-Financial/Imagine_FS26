import { describe, expect, test } from 'bun:test';

import { coverageTier } from '../src/lib/coverage';

describe('coverageTier', () => {
  test('is missing when the API withheld the multiple', () => {
    expect(coverageTier({ coverageWeight: 0.18, multiple: null })).toBe(
      'missing'
    );
  });

  test('is low below half of portfolio weight', () => {
    expect(coverageTier({ coverageWeight: 0.41, multiple: 31.9 })).toBe('low');
  });

  test('is full at exactly half and above', () => {
    expect(coverageTier({ coverageWeight: 0.5, multiple: 31.9 })).toBe('full');
    expect(coverageTier({ coverageWeight: 0.94, multiple: 6.8 })).toBe('full');
  });
});
