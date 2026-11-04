import { describe, expect, test } from 'bun:test';

import { lastValue, toChartRows } from '../src/lib/price-series';

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
