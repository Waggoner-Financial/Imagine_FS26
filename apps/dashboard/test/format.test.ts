import { describe, expect, test } from 'bun:test';

import {
  formatCompactPercent,
  formatCount,
  formatDate,
  formatMoney,
  formatPercent,
  formatPercentagePoints,
  formatPrice,
  formatSignedCompactPercent,
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
    expect(formatCompactPercent(null)).toBe(MISSING);
    expect(formatSignedCompactPercent(null)).toBe(MISSING);
    expect(formatPercentagePoints(null)).toBe(MISSING);
    expect(formatPrice(null)).toBe(MISSING);
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

describe('compact portfolio figures', () => {
  test('format target weights without unnecessary decimals', () => {
    expect(formatCompactPercent(0.12)).toBe('12%');
    expect(formatCompactPercent(0.125)).toBe('12.5%');
  });

  test('format holding expected return with one decimal and a sign', () => {
    expect(formatSignedCompactPercent(0.2669)).toBe('+26.7%');
    expect(formatSignedCompactPercent(-0.08)).toBe('-8.0%');
  });

  test('convert fractional contributions to percentage points', () => {
    expect(formatPercentagePoints(0.032027)).toBe('3.20');
    expect(formatPercentagePoints(-0.0104)).toBe('-1.04');
  });

  test('format security prices with two decimal places', () => {
    expect(formatPrice(118.4)).toBe('$118.40');
    expect(formatPrice(150)).toBe('$150.00');
  });
});
