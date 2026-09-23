import { describe, expect, test } from 'bun:test';

import type { Book, Holding } from '../src/book.types';
import { BOOKS_BY_ID } from '../src/books';
import {
  annualizeDailyVol,
  attributionShares,
  bottomContributions,
  countCovered,
  coverageByWeight,
  coverageByWeightedEr,
  coverageTier,
  erCoveredWeight,
  expectedReturn,
  portfolioExpectedReturn,
  reportedReturnSinceTrade,
  sectorRollups,
  tenDay,
  tickersWithoutTarget,
  topContributions,
  totalWeight,
  weightedErWeights,
  weightedVolAnnualized,
  ytdReturnOf,
} from '../src/derive';
import { buildSeries, downsample, MAX_SERIES_POINTS } from '../src/series';

const bookFor = (id: string): Book => {
  const book = BOOKS_BY_ID.get(id);
  if (book === undefined) throw new Error(`Missing fixture book ${id}`);
  return book;
};

const holdingIn = (book: Book, ticker: string): Holding => {
  const holding = book.holdings.find((entry) => entry.ticker === ticker);
  if (holding === undefined) throw new Error(`Missing ${ticker} in ${book.id}`);
  return holding;
};

const EQUITY = bookFor('p-equity');
const MOVER_COUNT = 3;

const paysDividend = (holding: Holding): boolean => holding.paysDividend;
const hasFcf = (holding: Holding): boolean => holding.hasFcfData;

describe('EQUITY reconciliation table', () => {
  test('weights sum to 1.00 including cash', () => {
    expect(totalWeight(EQUITY.holdings)).toBeCloseTo(1, 10);
  });

  test('reports a since-trade return of 0.0251', () => {
    expect(reportedReturnSinceTrade(EQUITY.holdings)).toBe(0.0251);
  });

  test('derives a portfolio expected return of 0.1545', () => {
    expect(portfolioExpectedReturn(EQUITY.holdings)).toBeCloseTo(0.1545, 4);
  });

  test('covers 0.94 of weight for expected return', () => {
    expect(erCoveredWeight(EQUITY.holdings)).toBeCloseTo(0.94, 10);
  });

  test('attributes 0.855 of the return to the top three movers', () => {
    expect(
      attributionShares(EQUITY.holdings, MOVER_COUNT).topShare
    ).toBeCloseTo(0.855, 3);
  });

  test('attributes -0.363 to the bottom three movers', () => {
    expect(
      attributionShares(EQUITY.holdings, MOVER_COUNT).bottomShare
    ).toBeCloseTo(-0.363, 3);
  });

  test('derives a weighted annualized volatility of 0.3536', () => {
    expect(weightedVolAnnualized(EQUITY.holdings)).toBeCloseTo(0.3536, 4);
  });

  test('scales one-day VaR to ten days by root ten', () => {
    expect(tenDay(EQUITY.risk.var95)).toBeCloseTo(-0.0449, 4);
  });

  test('annualizes daily GARCH volatility by root 252', () => {
    expect(annualizeDailyVol(0.0121)).toBeCloseTo(0.192, 3);
  });

  test('ranks SOFI, HOOD and DUOL as the top movers', () => {
    const tickers = topContributions(EQUITY.holdings, MOVER_COUNT).map(
      (e) => e.holding.ticker
    );
    expect(tickers).toEqual(['SOFI', 'HOOD', 'DUOL']);
  });

  test('ranks PLTR, UNH and XOM as the bottom movers, most negative first', () => {
    const tickers = bottomContributions(EQUITY.holdings, MOVER_COUNT).map(
      (e) => e.holding.ticker
    );
    expect(tickers).toEqual(['PLTR', 'UNH', 'XOM']);
  });
});

describe('EQUITY derived coverage', () => {
  test('derives pDIV target-weight coverage of 0.58 from the payer list', () => {
    expect(coverageByWeight(EQUITY.holdings, paysDividend)).toBeCloseTo(
      0.58,
      10
    );
  });

  test('derives pDIV weighted-ER coverage of 0.60', () => {
    expect(coverageByWeightedEr(EQUITY.holdings, paysDividend)).toBeCloseTo(
      0.6,
      2
    );
  });

  test('clears the grey tier on both pDIV coverage figures', () => {
    expect(coverageTier(coverageByWeight(EQUITY.holdings, paysDividend))).toBe(
      'FULL'
    );
    expect(
      coverageTier(coverageByWeightedEr(EQUITY.holdings, paysDividend))
    ).toBe('FULL');
  });

  test('covers 11 of 12 holdings and 0.88 of weight on FCF', () => {
    expect(countCovered(EQUITY.holdings, hasFcf)).toBe(11);
    expect(coverageByWeight(EQUITY.holdings, hasFcf)).toBeCloseTo(0.88, 10);
  });
});

describe('EQUITY sector rollup', () => {
  const rollups = sectorRollups(
    EQUITY.holdings,
    EQUITY.ytdBenchmarkReturn,
    ytdReturnOf
  );
  const bySector = new Map(rollups.map((rollup) => [rollup.name, rollup]));

  test('matches the spec weights', () => {
    expect(bySector.get('Technology')?.weight).toBeCloseTo(0.36, 10);
    expect(bySector.get('Healthcare')?.weight).toBeCloseTo(0.15, 10);
    expect(bySector.get('Financial Services')?.weight).toBeCloseTo(0.13, 10);
    expect(bySector.get('Cash')?.weight).toBeCloseTo(0.06, 10);
  });

  test('matches the spec YTD sector returns', () => {
    expect(bySector.get('Technology')?.return).toBeCloseTo(-0.1, 2);
    expect(bySector.get('Healthcare')?.return).toBeCloseTo(-0.04, 2);
    expect(bySector.get('Financial Services')?.return).toBeCloseTo(0.21, 2);
  });

  test('leaves cash without a return or a benchmark delta', () => {
    expect(bySector.get('Cash')?.return).toBeNull();
    expect(bySector.get('Cash')?.vsBenchmark).toBeNull();
  });

  test('orders sectors heaviest first and cash last', () => {
    expect(rollups[0].name).toBe('Technology');
    expect(rollups[rollups.length - 1].name).toBe('Cash');
  });
});

describe('every panel has a null case somewhere in the five books', () => {
  test('EARNINGS has no trade date', () => {
    expect(bookFor('p-earnings').tradeDate).toBeNull();
  });

  test('DIVIDEND puts pDIV in the dash tier and pFCF in the grey tier', () => {
    const { holdings } = bookFor('p-dividend');
    expect(coverageTier(coverageByWeight(holdings, paysDividend))).toBe('DASH');
    expect(coverageTier(coverageByWeight(holdings, hasFcf))).toBe('GREY');
  });

  test('FCF is flat, so attribution shares are null with a reason', () => {
    const { holdings } = bookFor('p-fcf');
    expect(reportedReturnSinceTrade(holdings)).toBe(0.0004);

    const shares = attributionShares(holdings, MOVER_COUNT);
    expect(shares.topShare).toBeNull();
    expect(shares.bottomShare).toBeNull();
    expect(shares.reason).toBe('n/a (portfolio flat)');
  });

  test('REVENUE lists its two holdings with no price target', () => {
    expect(tickersWithoutTarget(bookFor('p-revenue').holdings)).toEqual([
      'SHOP',
      'SNOW',
    ]);
  });

  test('REVENUE has no GARCH estimate but does carry a reason', () => {
    const { risk } = bookFor('p-revenue');
    expect(risk.garchVolDaily).toBeNull();
    expect(risk.garchReason).toBeTruthy();
  });

  test('EQUITY returns an empty index series with a reason', () => {
    expect(EQUITY.series.indexReason).toBeTruthy();
  });

  test('EQUITY has no one-day deployment gain/loss', () => {
    const oneDay = EQUITY.deployment.gainLoss.find(
      (entry) => entry.value === null
    );
    expect(oneDay?.reason).toBe('Not available for this horizon');
  });
});

describe('weighted-ER weighting excludes non-positive ER', () => {
  const REVENUE = bookFor('p-revenue');

  test('drops a holding trading above its price target', () => {
    expect(expectedReturn(holdingIn(REVENUE, 'CRWD'))).toBeLessThan(0);
    expect(weightedErWeights(REVENUE.holdings).has('CRWD')).toBe(false);
  });

  test('renormalizes the surviving weights to 1', () => {
    const weights = [...weightedErWeights(REVENUE.holdings).values()];
    expect(weights.reduce((total, weight) => total + weight, 0)).toBeCloseTo(
      1,
      10
    );
  });

  test('keeps every holding in EQUITY, where no ER is negative', () => {
    expect(weightedErWeights(EQUITY.holdings).size).toBe(12);
  });
});

describe('expectedReturn boundary inputs', () => {
  const base: Holding = {
    hasFcfData: true,
    isCash: false,
    name: 'Test',
    paysDividend: false,
    price: 100,
    priceTarget: 120,
    returnSinceTrade: 0,
    sector: 'Technology',
    targetWeight: 0.1,
    ticker: 'TEST',
    volAnnualized: 0.2,
    ytdReturn: 0,
  };

  test('returns null for cash', () => {
    expect(expectedReturn({ ...base, isCash: true })).toBeNull();
  });

  test('returns null with no price target', () => {
    expect(expectedReturn({ ...base, priceTarget: null })).toBeNull();
  });

  test('returns null at a zero price rather than dividing by zero', () => {
    expect(expectedReturn({ ...base, price: 0 })).toBeNull();
  });

  test('computes raw upside otherwise', () => {
    expect(expectedReturn(base)).toBeCloseTo(0.2, 10);
  });
});

describe('price series', () => {
  test('pins the portfolio line to the since-trade return', () => {
    const points = buildSeries(
      'p-equity:EQUITY',
      '2026-08-12',
      '2026-09-01',
      0.0251,
      0.004
    );
    expect(points[0].value).toBe(0);
    expect(points[points.length - 1].value).toBeCloseTo(0.0251, 6);
  });

  test('is deterministic across calls', () => {
    const first = buildSeries(
      'p-equity:EQUITY',
      '2026-08-12',
      '2026-09-01',
      0.0251,
      0.004
    );
    const second = buildSeries(
      'p-equity:EQUITY',
      '2026-08-12',
      '2026-09-01',
      0.0251,
      0.004
    );
    expect(first).toEqual(second);
  });

  test('differs between series keys', () => {
    const portfolio = buildSeries(
      'p-equity:EQUITY',
      '2026-08-12',
      '2026-09-01',
      0.0251,
      0.004
    );
    const benchmark = buildSeries(
      'p-equity:SPY',
      '2026-08-12',
      '2026-09-01',
      0.0251,
      0.004
    );
    expect(portfolio).not.toEqual(benchmark);
  });

  test('downsamples an ALL window to at most the point cap', () => {
    const points = buildSeries(
      'p-equity:EQUITY',
      '2021-03-01',
      '2026-09-01',
      0.0251,
      0.004
    );
    expect(points.length).toBeLessThanOrEqual(MAX_SERIES_POINTS);
    expect(points.length).toBeGreaterThan(0);
  });

  test('never drops the last point when sampling', () => {
    const points = Array.from({ length: 1000 }, (_value, index) => ({
      date: `2026-01-${index}`,
      value: index,
    }));
    const sampled = downsample(points, MAX_SERIES_POINTS);
    expect(sampled[sampled.length - 1]).toEqual(points[points.length - 1]);
  });

  test('leaves a series shorter than the cap untouched', () => {
    const points = [{ date: '2026-09-01', value: 0 }];
    expect(downsample(points, MAX_SERIES_POINTS)).toEqual(points);
  });
});
