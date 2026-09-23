import { describe, expect, test } from 'bun:test';

import { yoga } from '../src/server';

type GraphQLError = { extensions?: { code?: string }; message: string };
type GraphQLResult<T> = { data?: T | null; errors?: GraphQLError[] };

const PORTFOLIO_IDS = [
  'p-equity',
  'p-earnings',
  'p-dividend',
  'p-fcf',
  'p-revenue',
];
const HORIZONS = [
  'ONE_DAY',
  'ONE_MONTH',
  'ONE_YEAR',
  'YTD',
  'ALL',
  'SINCE_TRADE',
];

// Sends a request through the server exactly as a client would, minus the
// network hop, and returns the parsed GraphQL response.
async function execute<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<GraphQLResult<T>> {
  const response = await yoga.fetch('http://localhost/graphql', {
    body: JSON.stringify({ query, variables }),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  });
  return (await response.json()) as GraphQLResult<T>;
}

// Like execute, but fails the test on any GraphQL error and returns the data.
async function run<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const result = await execute<T>(query, variables);
  expect(result.errors).toBeUndefined();
  if (result.data == null) throw new Error('Response had no data');
  return result.data;
}

// Selects every field of every type, so a non-null field that resolves to
// null or undefined surfaces as a GraphQL error rather than going unnoticed.
const EVERY_FIELD = /* GraphQL */ `
  fragment Value on FourPriceValue {
    multiple
    coverageWeight
    coveredHoldings
    totalHoldings
    reason
  }
  fragment Set on FourPriceSet {
    rev {
      ...Value
    }
    fcf {
      ...Value
    }
    ern {
      ...Value
    }
    div {
      ...Value
    }
  }
  fragment Stat on RankStat {
    percentile
    zScore
    universeMean
    universeStdDev
    reason
  }
  fragment Ranking on FourPriceRanking {
    universe
    constituents
    rev {
      ...Stat
    }
    fcf {
      ...Stat
    }
    ern {
      ...Stat
    }
    div {
      ...Stat
    }
  }
  fragment MoverRow on Mover {
    ticker
    name
    returnSinceTrade
    targetWeight
    currentWeight
    driftPp
    contribution
  }
  fragment Contributor on ErContributor {
    ticker
    targetWeight
    price
    priceTarget
    er
    contribution
  }
  query Everything($id: ID!, $horizon: DashboardHorizon!) {
    dashboardPortfolios {
      id
      code
      name
    }
    portfolioDashboardSummary(portfolioId: $id) {
      portfolio {
        id
        code
        name
      }
      holdingsCount
      tradeDate
      returnSinceTrade {
        baselineDate
        latestDate
        returnPct
        flowAdjusted
      }
      asOf
    }
    portfolioPriceSeries(portfolioId: $id, horizon: $horizon) {
      horizon
      windowStart
      series {
        id
        label
        kind
        reason
        points {
          date
          value
        }
      }
      asOf
    }
    portfolioFourPrice(portfolioId: $id) {
      byTargetWeight {
        ...Set
      }
      byWeightedEr {
        ...Set
      }
      vsSp500 {
        ...Ranking
      }
      vsIndex {
        ...Ranking
      }
      asOf
    }
    portfolioRisk(portfolioId: $id) {
      windowDays
      requestedWindowDays
      windowNote
      var95
      var99
      es95
      es99
      var95TenDay
      var99TenDay
      es95TenDay
      es99TenDay
      garchVolDaily
      garchVolAnnualized
      garchReason
      weightedVolAnnualized
      weightedVolCoverage
      topCorrelations {
        a
        b
        rho
      }
      bottomCorrelations {
        a
        b
        rho
      }
      asOf
    }
    portfolioMovers(portfolioId: $id) {
      tradeDate
      baselineDate
      top {
        ...MoverRow
      }
      bottom {
        ...MoverRow
      }
      attribution {
        portfolioReturn
        topShare
        bottomShare
        reason
      }
      reason
      asOf
    }
    portfolioExpectedReturn(portfolioId: $id) {
      portfolioEr
      coveredWeight
      topContributors {
        ...Contributor
      }
      bottomContributors {
        ...Contributor
      }
      noTarget
      stalePriceTargets {
        count
        tickers {
          ticker
          priceTargetDate
          lastEarningsDate
        }
      }
      asOf
    }
    deploymentSummary(portfolioId: $id) {
      accountsCount
      clientsCount
      aum {
        value
        asOf
        source
        reason
      }
      gainLoss {
        horizon
        value
        pct
        reason
      }
      asOf
    }
    portfolioSectorWeights(portfolioId: $id, horizon: $horizon) {
      horizon
      benchmarkReturn
      sectors {
        name
        weight
        return
        vsBenchmark
        isCash
        holdings
      }
      holdings {
        ticker
        name
        sector
        weight
        return
        isCash
      }
      asOf
    }
  }
`;

describe('every query resolves for every portfolio', () => {
  test.each(PORTFOLIO_IDS)('resolves every field for %s', async (id) => {
    for (const horizon of HORIZONS) {
      const result = await execute(EVERY_FIELD, { horizon, id });
      expect(result.errors).toBeUndefined();
    }
  });

  test('lists the five sample portfolios by code', async () => {
    const data = await run<{ dashboardPortfolios: { code: string }[] }>(
      '{ dashboardPortfolios { code } }'
    );
    expect(data.dashboardPortfolios.map((p) => p.code)).toEqual([
      'EQUITY',
      'EARNINGS',
      'DIVIDEND',
      'FCF',
      'REVENUE',
    ]);
  });

  test('rejects an unknown portfolio with a NOT_FOUND error', async () => {
    const result = await execute(
      '{ portfolioRisk(portfolioId: "p-nope") { var95 } }'
    );
    expect(result.errors?.[0]?.message).toBe('Unknown portfolio p-nope');
    expect(result.errors?.[0]?.extensions?.code).toBe('NOT_FOUND');
  });
});

describe('portfolioDashboardSummary', () => {
  type Summary = {
    portfolioDashboardSummary: {
      holdingsCount: number;
      returnSinceTrade: { flowAdjusted: boolean; returnPct: number } | null;
      tradeDate: string | null;
    };
  };
  const QUERY = /* GraphQL */ `
    query ($id: ID!) {
      portfolioDashboardSummary(portfolioId: $id) {
        holdingsCount
        tradeDate
        returnSinceTrade {
          returnPct
          flowAdjusted
        }
      }
    }
  `;

  test('counts holdings excluding cash', async () => {
    const data = await run<Summary>(QUERY, { id: 'p-equity' });
    expect(data.portfolioDashboardSummary.holdingsCount).toBe(12);
  });

  test('reports the reconciled since-trade return, not flow-adjusted', async () => {
    const data = await run<Summary>(QUERY, { id: 'p-equity' });
    expect(data.portfolioDashboardSummary.returnSinceTrade).toEqual({
      flowAdjusted: false,
      returnPct: 0.0251,
    });
  });

  test('returns null trade date and return when no trade date is set', async () => {
    const data = await run<Summary>(QUERY, { id: 'p-earnings' });
    expect(data.portfolioDashboardSummary.tradeDate).toBeNull();
    expect(data.portfolioDashboardSummary.returnSinceTrade).toBeNull();
  });
});

describe('portfolioPriceSeries', () => {
  type Series = {
    kind: string;
    points: { date: string; value: number }[];
    reason: string | null;
  };
  type Payload = {
    portfolioPriceSeries: {
      horizon: string;
      series: Series[];
      windowStart: string;
    };
  };
  const QUERY = /* GraphQL */ `
    query ($id: ID!, $horizon: DashboardHorizon!) {
      portfolioPriceSeries(portfolioId: $id, horizon: $horizon) {
        horizon
        windowStart
        series {
          kind
          reason
          points {
            date
            value
          }
        }
      }
    }
  `;
  const load = async (id: string, horizon: string) =>
    (await run<Payload>(QUERY, { horizon, id })).portfolioPriceSeries;

  test('anchors SINCE_TRADE to the trade date and ends at the header figure', async () => {
    const payload = await load('p-equity', 'SINCE_TRADE');
    const points = payload.series[0]?.points ?? [];

    expect(payload.horizon).toBe('SINCE_TRADE');
    expect(payload.windowStart).toBe('2026-08-12');
    expect(points[0]?.value).toBe(0);
    expect(points.at(-1)?.value).toBeCloseTo(0.0251, 6);
  });

  test('anchors ALL to inception and downsamples every line', async () => {
    const payload = await load('p-equity', 'ALL');
    expect(payload.windowStart).toBe('2021-03-01');
    for (const series of payload.series) {
      expect(series.points.length).toBeLessThanOrEqual(260);
    }
  });

  test('rebases every populated line to zero at windowStart', async () => {
    const payload = await load('p-equity', 'ONE_YEAR');
    const populated = payload.series.filter((s) => s.points.length > 0);
    expect(populated).toHaveLength(2);
    for (const series of populated) expect(series.points[0]?.value).toBe(0);
  });

  test('returns the index line empty with a reason', async () => {
    const payload = await load('p-equity', 'ALL');
    const index = payload.series.find((s) => s.kind === 'INDEX');
    expect(index?.points).toEqual([]);
    expect(index?.reason).toBe('Index series not available before 2026-08-20');
  });

  test('returns every line empty with a reason when there is no trade date', async () => {
    const payload = await load('p-earnings', 'SINCE_TRADE');
    for (const series of payload.series) {
      expect(series.points).toEqual([]);
      expect(series.reason).toBeTruthy();
    }
  });
});

describe('portfolioFourPrice', () => {
  type Value = {
    coverageWeight: number;
    multiple: number | null;
    reason: string | null;
  };
  type Payload = {
    portfolioFourPrice: {
      byTargetWeight: { div: Value; fcf: Value };
      byWeightedEr: { div: Value };
    };
  };
  const QUERY = /* GraphQL */ `
    query ($id: ID!) {
      portfolioFourPrice(portfolioId: $id) {
        byTargetWeight {
          div {
            multiple
            coverageWeight
            reason
          }
          fcf {
            multiple
            coverageWeight
            reason
          }
        }
        byWeightedEr {
          div {
            multiple
            coverageWeight
            reason
          }
        }
      }
    }
  `;
  const load = async (id: string) =>
    (await run<Payload>(QUERY, { id })).portfolioFourPrice;

  test('reports the dividend multiple when coverage clears the floor', async () => {
    const { div } = (await load('p-equity')).byTargetWeight;
    expect(div.multiple).toBe(92.5);
    expect(div.coverageWeight).toBeCloseTo(0.58, 10);
    expect(div.reason).toBeNull();
  });

  test('withholds the multiple with a reason below the dash tier', async () => {
    const { div } = (await load('p-dividend')).byTargetWeight;
    expect(div.multiple).toBeNull();
    expect(div.reason).toBe('Coverage of 18% of weight is below the 25% floor');
  });

  test('keeps the multiple in the grey tier, where only the UI changes', async () => {
    const { fcf } = (await load('p-dividend')).byTargetWeight;
    expect(fcf.multiple).toBe(31.9);
    expect(fcf.reason).toBeNull();
  });

  test('reports weighted-ER coverage separately from target-weight coverage', async () => {
    const payload = await load('p-equity');
    expect(payload.byTargetWeight.div.coverageWeight).toBeCloseTo(0.58, 10);
    expect(payload.byWeightedEr.div.coverageWeight).toBeCloseTo(0.6, 2);
  });
});

describe('portfolioRisk', () => {
  type Payload = {
    portfolioRisk: {
      es99TenDay: number;
      garchReason: string | null;
      garchVolAnnualized: number | null;
      garchVolDaily: number | null;
      var95TenDay: number;
      windowNote: string | null;
    };
  };
  const QUERY = /* GraphQL */ `
    query ($id: ID!) {
      portfolioRisk(portfolioId: $id) {
        var95TenDay
        es99TenDay
        garchVolDaily
        garchVolAnnualized
        garchReason
        windowNote
      }
    }
  `;
  const load = async (id: string) =>
    (await run<Payload>(QUERY, { id })).portfolioRisk;

  test('derives the ten-day figures from the one-day ones', async () => {
    const payload = await load('p-equity');
    expect(payload.var95TenDay).toBeCloseTo(-0.0449, 4);
    expect(payload.es99TenDay).toBeCloseTo(-0.0961, 4);
  });

  test('annualizes the GARCH estimate', async () => {
    expect((await load('p-equity')).garchVolAnnualized).toBeCloseTo(0.192, 3);
  });

  test('returns a reason instead of a GARCH figure when it did not converge', async () => {
    const payload = await load('p-revenue');
    expect(payload.garchVolDaily).toBeNull();
    expect(payload.garchVolAnnualized).toBeNull();
    expect(payload.garchReason).toBeTruthy();
  });

  test('explains a shortened history window', async () => {
    expect((await load('p-equity')).windowNote).toContain('320 days');
  });
});

describe('portfolioMovers', () => {
  type Row = {
    currentWeight: number;
    driftPp: number;
    targetWeight: number;
    ticker: string;
  };
  type Payload = {
    portfolioMovers: {
      attribution: {
        portfolioReturn: number;
        reason: string | null;
        topShare: number | null;
      } | null;
      bottom: Row[];
      reason: string | null;
      top: Row[];
    };
  };
  const QUERY = /* GraphQL */ `
    query ($id: ID!, $count: Int) {
      portfolioMovers(portfolioId: $id, count: $count) {
        top {
          ticker
          targetWeight
          currentWeight
          driftPp
        }
        bottom {
          ticker
          targetWeight
          currentWeight
          driftPp
        }
        attribution {
          portfolioReturn
          topShare
          reason
        }
        reason
      }
    }
  `;
  const load = async (id: string, variables: Record<string, unknown> = {}) =>
    (await run<Payload>(QUERY, { id, ...variables })).portfolioMovers;
  const tickers = (rows: Row[]) => rows.map((row) => row.ticker);

  test('ranks the top and bottom three movers', async () => {
    const payload = await load('p-equity');
    expect(tickers(payload.top)).toEqual(['SOFI', 'HOOD', 'DUOL']);
    expect(tickers(payload.bottom)).toEqual(['PLTR', 'UNH', 'XOM']);
  });

  test('attributes the header return to the top movers', async () => {
    const { attribution } = await load('p-equity');
    expect(attribution?.portfolioReturn).toBe(0.0251);
    expect(attribution?.topShare).toBeCloseTo(0.855, 3);
  });

  test('drifts a winner above its target weight', async () => {
    const sofi = (await load('p-equity')).top[0];
    expect(sofi?.currentWeight).toBeGreaterThan(sofi?.targetWeight ?? 1);
    expect(sofi?.driftPp).toBeGreaterThan(0);
  });

  test('explains itself instead of returning movers with no trade date', async () => {
    const payload = await load('p-earnings');
    expect(payload.top).toEqual([]);
    expect(payload.bottom).toEqual([]);
    expect(payload.attribution).toBeNull();
    expect(payload.reason).toBe('Set a trade date on Drift to see movers');
  });

  test('returns a flat-portfolio reason rather than a meaningless share', async () => {
    const { attribution } = await load('p-fcf');
    expect(attribution?.topShare).toBeNull();
    expect(attribution?.reason).toBe('n/a (portfolio flat)');
  });

  test('honours an explicit count', async () => {
    expect((await load('p-equity', { count: 1 })).top).toHaveLength(1);
  });

  test('returns no movers for a count of zero', async () => {
    const payload = await load('p-equity', { count: 0 });
    expect(payload.top).toEqual([]);
    expect(payload.bottom).toEqual([]);
  });

  test('falls back to three movers when count is sent as null', async () => {
    expect((await load('p-equity', { count: null })).top).toHaveLength(3);
  });
});

describe('portfolioExpectedReturn', () => {
  type Payload = {
    portfolioExpectedReturn: {
      bottomContributors: { ticker: string }[];
      coveredWeight: number;
      noTarget: string[];
      portfolioEr: number;
      stalePriceTargets: { count: number; tickers: { ticker: string }[] };
      topContributors: { ticker: string }[];
    };
  };
  const QUERY = /* GraphQL */ `
    query ($id: ID!, $count: Int) {
      portfolioExpectedReturn(portfolioId: $id, count: $count) {
        portfolioEr
        coveredWeight
        topContributors {
          ticker
        }
        bottomContributors {
          ticker
        }
        noTarget
        stalePriceTargets {
          count
          tickers {
            ticker
          }
        }
      }
    }
  `;
  const load = async (id: string, variables: Record<string, unknown> = {}) =>
    (await run<Payload>(QUERY, { id, ...variables })).portfolioExpectedReturn;

  test('reports the reconciled portfolio ER and covered weight', async () => {
    const payload = await load('p-equity');
    expect(payload.portfolioEr).toBeCloseTo(0.1545, 4);
    expect(payload.coveredWeight).toBeCloseTo(0.94, 10);
  });

  test('leads with NVDA and lists the stale price targets', async () => {
    const payload = await load('p-equity');
    expect(payload.topContributors[0]?.ticker).toBe('NVDA');
    expect(payload.stalePriceTargets.count).toBe(2);
    expect(payload.stalePriceTargets.tickers.map((t) => t.ticker)).toEqual([
      'UNH',
      'CAT',
    ]);
  });

  test('lists holdings with no price target and leaves them out of coverage', async () => {
    const payload = await load('p-revenue');
    expect(payload.noTarget).toEqual(['SHOP', 'SNOW']);
    expect(payload.coveredWeight).toBeCloseTo(0.68, 10);
  });

  test('returns no contributors for a count of zero', async () => {
    const payload = await load('p-equity', { count: 0 });
    expect(payload.topContributors).toEqual([]);
    expect(payload.bottomContributors).toEqual([]);
  });
});

describe('deploymentSummary', () => {
  type Payload = {
    deploymentSummary: {
      accountsCount: number;
      aum: { source: string; value: number | null };
      gainLoss: {
        horizon: string;
        pct: number | null;
        reason: string | null;
        value: number | null;
      }[];
    };
  };
  const QUERY = /* GraphQL */ `
    query ($id: ID!) {
      deploymentSummary(portfolioId: $id) {
        accountsCount
        aum {
          value
          source
        }
        gainLoss {
          horizon
          value
          pct
          reason
        }
      }
    }
  `;

  test('reports AUM and where it came from', async () => {
    const { deploymentSummary } = await run<Payload>(QUERY, { id: 'p-equity' });
    expect(deploymentSummary.aum).toEqual({
      source: 'ACCOUNTING_SYSTEM',
      value: 184_300_000,
    });
    expect(deploymentSummary.accountsCount).toBe(312);
  });

  test('returns a reason rather than a zero for the unavailable horizon', async () => {
    const { deploymentSummary } = await run<Payload>(QUERY, { id: 'p-equity' });
    const oneDay = deploymentSummary.gainLoss.find(
      (g) => g.horizon === 'ONE_DAY'
    );
    expect(oneDay).toEqual({
      horizon: 'ONE_DAY',
      pct: null,
      reason: 'Not available for this horizon',
      value: null,
    });
  });
});

describe('portfolioSectorWeights', () => {
  type Payload = {
    portfolioSectorWeights: {
      holdings: { isCash: boolean }[];
      sectors: {
        isCash: boolean;
        name: string;
        return: number | null;
        vsBenchmark: number | null;
        weight: number;
      }[];
    };
  };
  const QUERY = /* GraphQL */ `
    query ($id: ID!) {
      portfolioSectorWeights(portfolioId: $id, horizon: YTD) {
        sectors {
          name
          weight
          return
          vsBenchmark
          isCash
        }
        holdings {
          isCash
        }
      }
    }
  `;

  test('matches the spec sector weights and YTD returns', async () => {
    const data = await run<Payload>(QUERY, { id: 'p-equity' });
    const byName = new Map(
      data.portfolioSectorWeights.sectors.map((s) => [s.name, s])
    );
    expect(byName.get('Technology')?.weight).toBeCloseTo(0.36, 10);
    expect(byName.get('Technology')?.return).toBeCloseTo(-0.1, 2);
    expect(byName.get('Technology')?.vsBenchmark).toBeCloseTo(-0.18, 2);
  });

  test('leaves cash without a return', async () => {
    const data = await run<Payload>(QUERY, { id: 'p-equity' });
    const cash = data.portfolioSectorWeights.sectors.find((s) => s.isCash);
    expect(cash?.return).toBeNull();
    expect(cash?.vsBenchmark).toBeNull();
  });

  test('returns one holding per row of the book, cash included', async () => {
    const data = await run<Payload>(QUERY, { id: 'p-equity' });
    expect(data.portfolioSectorWeights.holdings).toHaveLength(13);
  });
});
