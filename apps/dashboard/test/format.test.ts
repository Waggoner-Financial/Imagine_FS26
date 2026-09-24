import { describe, expect, test } from 'bun:test';

import {
  formatCount,
  formatDate,
  formatMoney,
  formatPercent,
  formatSignedMoney,
  formatSignedPercent,
  MISSING,
} from '../src/lib/format';

describe('missing figures', () => {
  test('render as an em dash, never as zero', () => {
    expect(formatPercent(null)).toBe(MISSING);
    expect(formatSignedPercent(undefined)).toBe(MISSING);
    expect(formatMoney(null)).toBe(MISSING);
    expect(formatSignedMoney(null)).toBe(MISSING);
    expect(formatDate(null)).toBe(MISSING);
  });
});

describe('fractions', () => {
  test('format as percentages', () => {
    expect(formatPercent(0.0251)).toBe('2.51%');
  });

  test('carry an explicit sign for gains and losses', () => {
    expect(formatSignedPercent(0.0251)).toBe('+2.51%');
    expect(formatSignedPercent(-0.0142)).toBe('-1.42%');
  });

  test('show zero without a sign', () => {
    expect(formatSignedPercent(0)).toBe('0.00%');
  });
});

describe('dollars', () => {
  test('use compact notation with four significant digits', () => {
    expect(formatMoney(184_300_000)).toBe('$184.3M');
    expect(formatMoney(2_150_000)).toBe('$2.15M');
    expect(formatMoney(61_000)).toBe('$61K');
  });

  test('carry an explicit sign for gains', () => {
    expect(formatSignedMoney(16_900_000)).toBe('+$16.9M');
  });
});

describe('dates', () => {
  test('keep the calendar day regardless of the local timezone', () => {
    expect(formatDate('2026-09-01')).toBe('Sep 1, 2026');
  });
});

describe('counts', () => {
  test('group thousands', () => {
    expect(formatCount(1234)).toBe('1,234');
  });
});
