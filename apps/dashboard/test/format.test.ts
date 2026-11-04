import { describe, expect, test } from 'bun:test';

import {
  formatCount,
  formatDate,
  formatDriftPp,
  formatMoney,
  formatMultiple,
  formatPercent,
  formatPercentile,
  formatShare,
  formatSignedMoney,
  formatSignedPercent,
  formatZScore,
  MISSING,
} from '../src/lib/format';

describe('missing figures', () => {
  test('render as an em dash, never as zero', () => {
    expect(formatPercent(null)).toBe(MISSING);
    expect(formatSignedPercent(undefined)).toBe(MISSING);
    expect(formatMoney(null)).toBe(MISSING);
    expect(formatSignedMoney(null)).toBe(MISSING);
    expect(formatDate(null)).toBe(MISSING);
    expect(formatMultiple(null)).toBe(MISSING);
    expect(formatPercentile(null)).toBe(MISSING);
    expect(formatZScore(undefined)).toBe(MISSING);
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

describe('valuation multiples', () => {
  test('show one decimal and a times sign', () => {
    expect(formatMultiple(6.8)).toBe('6.8×');
    expect(formatMultiple(118.4)).toBe('118.4×');
  });
});

describe('percentiles', () => {
  test('read as ordinals', () => {
    expect(formatPercentile(0.82)).toBe('82nd');
    expect(formatPercentile(0.71)).toBe('71st');
    expect(formatPercentile(0.73)).toBe('73rd');
    expect(formatPercentile(0.88)).toBe('88th');
  });

  test('use th for the teens', () => {
    expect(formatPercentile(0.11)).toBe('11th');
    expect(formatPercentile(0.12)).toBe('12th');
    expect(formatPercentile(0.13)).toBe('13th');
  });
});

describe('z-scores', () => {
  test('carry an explicit sign', () => {
    expect(formatZScore(1.1)).toBe('+1.1');
    expect(formatZScore(-0.5)).toBe('-0.5');
  });

  test('show zero without a sign', () => {
    expect(formatZScore(0)).toBe('0.0');
  });
});

describe('drift', () => {
  test('formats percentage points with an explicit sign', () => {
    expect(formatDriftPp(0.7)).toBe('+0.7 pp');
    expect(formatDriftPp(-0.3)).toBe('-0.3 pp');
  });

  test('renders a missing drift as an em dash', () => {
    expect(formatDriftPp(null)).toBe(MISSING);
  });
});

describe('attribution shares', () => {
  test('format as signed percentages', () => {
    expect(formatShare(0.8553784860557769, null)).toBe('+85.54%');
    expect(formatShare(-0.36254980079681276, null)).toBe('-36.25%');
  });

  test('show the reason in place of a missing share', () => {
    expect(formatShare(null, 'n/a (portfolio flat)')).toBe(
      'n/a (portfolio flat)'
    );
    expect(formatShare(null, null)).toBe(MISSING);
  });
});
