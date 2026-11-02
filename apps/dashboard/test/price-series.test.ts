import { describe, expect, test } from 'bun:test';

import {
  axisDateFormatter,
  lastValue,
  toChartRows,
} from '../src/lib/price-series';

const portfolio = {
  id: 'EQUITY',
  points: [
    { date: '2026-08-12', value: 0 },
    { date: '2026-08-13', value: 0.0026 },
    { date: '2026-09-01', value: 0.0251 },
  ],
};

const benchmark = {
  id: 'SPY',
  points: [
    { date: '2026-08-12', value: 0 },
    { date: '2026-09-01', value: 0.0134 },
  ],
};

const emptyIndex = { id: 'FACTOR', points: [] };

describe('toChartRows', () => {
  test('merges series by date, leaving a missing date unset', () => {
    expect(toChartRows([portfolio, benchmark])).toEqual([
      { EQUITY: 0, SPY: 0, date: '2026-08-12' },
      { EQUITY: 0.0026, date: '2026-08-13' },
      { EQUITY: 0.0251, SPY: 0.0134, date: '2026-09-01' },
    ]);
  });

  test('adds no rows or keys for an empty series', () => {
    const rows = toChartRows([emptyIndex, benchmark]);
    expect(rows).toHaveLength(2);
    expect(rows.some((row) => 'FACTOR' in row)).toBe(false);
  });

  test('sorts rows by date whatever order the points arrive in', () => {
    const shuffled = { id: 'X', points: portfolio.points.toReversed() };
    expect(toChartRows([shuffled]).map((row) => row.date)).toEqual([
      '2026-08-12',
      '2026-08-13',
      '2026-09-01',
    ]);
  });
});

describe('lastValue', () => {
  test('is where the line ends', () => {
    expect(lastValue(portfolio)).toBe(0.0251);
  });

  test('is null for a series with no points, never 0', () => {
    expect(lastValue(emptyIndex)).toBeNull();
  });
});

describe('axisDateFormatter', () => {
  test('shows month and day for a window of about a month', () => {
    expect(axisDateFormatter('2026-08-01', '2026-09-01')('2026-08-13')).toBe(
      'Aug 13'
    );
  });

  test('still shows month and day at exactly 92 days', () => {
    expect(axisDateFormatter('2026-06-01', '2026-09-01')('2026-06-01')).toBe(
      'Jun 1'
    );
  });

  test('shows month and year for a 1Y window, which crosses a year', () => {
    const format = axisDateFormatter('2025-09-01', '2026-09-01');
    expect(format('2025-09-01')).toBe('Sep 2025');
    expect(format('2026-09-01')).toBe('Sep 2026');
  });

  test('shows month and year for a multi-year window', () => {
    expect(axisDateFormatter('2021-03-01', '2026-09-01')('2021-03-01')).toBe(
      'Mar 2021'
    );
  });
});
