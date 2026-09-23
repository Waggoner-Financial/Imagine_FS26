import {
  annualizeDailyVol,
  attributionShares,
  type Book,
  BOOKS,
  BOOKS_BY_ID,
  bottomContributions,
  buildSeries,
  type Contribution,
  countCovered,
  COVERAGE_DASH_THRESHOLD,
  coverageByWeight,
  coverageByWeightedEr,
  coverageTier,
  currentWeights,
  DashboardHorizon,
  erContributions,
  erCoveredWeight,
  expectedReturn,
  type Holding,
  type HorizonEndpoint,
  investedHoldings,
  investedWeight,
  portfolioExpectedReturn,
  type RankingInputs,
  REPORTED_DECIMALS,
  reportedReturnSinceTrade,
  roundTo,
  sectorRollups,
  SeriesKind,
  shiftDate,
  sinceTradeReturnOf,
  tenDay,
  tickersWithoutTarget,
  topContributions,
  weightedReturn,
  weightedVolAnnualized,
  ytdReturnOf,
} from '@imagine/mock-data';
import { GraphQLError } from 'graphql';

import type {
  DashboardPortfolio,
  DashboardSummary,
  DeploymentPayload,
  ErContributor,
  ExpectedReturnPayload,
  FourPricePayload,
  FourPriceRanking,
  FourPriceSet,
  FourPriceValue,
  Mover,
  MoversPayload,
  PriceSeries,
  PriceSeriesPayload,
  RankStat,
  Resolvers,
  RiskPayload,
  SectorWeightsPayload,
} from './generated/resolvers-types';

const BENCHMARK_ID = 'SPY';
const BENCHMARK_LABEL = 'S&P 500 (SPY)';
const INDEX_ID = 'FACTOR';
const INDEX_LABEL = 'Factor composite';

const DEFAULT_COUNT = 3;
const DRIFT_DECIMALS = 1;
const PERCENTAGE_POINTS = 100;
const WEIGHT_DECIMALS = 3;

/** Step size of the seeded random walk behind every price series. */
const SERIES_STEP = 0.004;

const NO_AUM_REASON = 'No AUM figure available';
const NO_TRADE_DATE_MOVERS = 'Set a trade date on Drift to see movers';
const NO_TRADE_DATE_SERIES = 'No trade date set for this portfolio';

type Predicate = (holding: Holding) => boolean;

const allInvested: Predicate = () => true;
const hasFcf: Predicate = (holding) => holding.hasFcfData;
const paysDividend: Predicate = (holding) => holding.paysDividend;

/**
 * Looks up a sample book by id. An unknown id becomes a GraphQL error with a
 * NOT_FOUND code rather than a server error, so clients can handle it.
 */
function bookFor(portfolioId: string): Book {
  const book = BOOKS_BY_ID.get(portfolioId);
  if (book === undefined) {
    throw new GraphQLError(`Unknown portfolio ${portfolioId}`, {
      extensions: { code: 'NOT_FOUND' },
    });
  }
  return book;
}

/**
 * `count` has a default of 3, but a client can still send null explicitly,
 * and a negative count has no sensible meaning; both are normalised here.
 */
function normaliseCount(count: number | null | undefined): number {
  return Math.max(0, count ?? DEFAULT_COUNT);
}

function toPortfolio(book: Book): DashboardPortfolio {
  return { code: book.code, id: book.id, name: book.name };
}

function summary(book: Book): DashboardSummary {
  return {
    asOf: book.asOf,
    holdingsCount: investedHoldings(book.holdings).length,
    portfolio: toPortfolio(book),
    returnSinceTrade:
      book.tradeDate === null
        ? null
        : {
            baselineDate: book.tradeDate,
            flowAdjusted: false,
            latestDate: book.asOf,
            returnPct: reportedReturnSinceTrade(book.holdings),
          },
    tradeDate: book.tradeDate,
  };
}

/** The date a horizon's window starts; null when there is no trade date. */
function windowStartFor(book: Book, horizon: DashboardHorizon): string | null {
  switch (horizon) {
    case DashboardHorizon.SINCE_TRADE:
      return book.tradeDate;
    case DashboardHorizon.ALL:
      return book.series.inception;
    case DashboardHorizon.YTD:
      return `${book.asOf.slice(0, 4)}-01-01`;
    case DashboardHorizon.ONE_YEAR:
      return shiftDate(book.asOf, -1, 0, 0);
    case DashboardHorizon.ONE_MONTH:
      return shiftDate(book.asOf, 0, -1, 0);
    case DashboardHorizon.ONE_DAY:
      return shiftDate(book.asOf, 0, 0, -1);
  }
}

/**
 * Where the portfolio and benchmark lines end for a horizon. SINCE_TRADE and
 * YTD are derived from the book; the other horizons are stated per book. A
 * horizon a book forgot to state renders as a flat line rather than an error.
 */
function endpointFor(book: Book, horizon: DashboardHorizon): HorizonEndpoint {
  if (horizon === DashboardHorizon.SINCE_TRADE) {
    return {
      benchmark: book.series.benchmarkSinceTrade,
      horizon,
      portfolio: reportedReturnSinceTrade(book.holdings),
    };
  }
  if (horizon === DashboardHorizon.YTD) {
    const ytd = weightedReturn(book.holdings, ytdReturnOf);
    return {
      benchmark: book.ytdBenchmarkReturn,
      horizon,
      portfolio: roundTo(ytd, REPORTED_DECIMALS),
    };
  }
  const stated = book.series.endpoints.find(
    (entry) => entry.horizon === horizon
  );
  return stated ?? { benchmark: 0, horizon, portfolio: 0 };
}

function emptySeries(
  id: string,
  label: string,
  kind: SeriesKind,
  reason: string
): PriceSeries {
  return { id, kind, label, points: [], reason };
}

function priceSeries(
  book: Book,
  horizon: DashboardHorizon
): PriceSeriesPayload {
  const windowStart = windowStartFor(book, horizon);
  const index = emptySeries(
    INDEX_ID,
    INDEX_LABEL,
    SeriesKind.INDEX,
    book.series.indexReason
  );

  if (windowStart === null) {
    return {
      asOf: book.asOf,
      horizon,
      series: [
        emptySeries(
          book.code,
          book.code,
          SeriesKind.PORTFOLIO,
          NO_TRADE_DATE_SERIES
        ),
        emptySeries(
          BENCHMARK_ID,
          BENCHMARK_LABEL,
          SeriesKind.BENCHMARK,
          NO_TRADE_DATE_SERIES
        ),
        index,
      ],
      windowStart: book.asOf,
    };
  }

  const endpoint = endpointFor(book, horizon);
  const walk = (id: string, endValue: number): PriceSeries['points'] =>
    buildSeries(
      `${book.id}:${id}:${horizon}`,
      windowStart,
      book.asOf,
      endValue,
      SERIES_STEP
    );

  return {
    asOf: book.asOf,
    horizon,
    series: [
      {
        id: book.code,
        kind: SeriesKind.PORTFOLIO,
        label: book.code,
        points: walk(book.code, endpoint.portfolio),
        reason: null,
      },
      {
        id: BENCHMARK_ID,
        kind: SeriesKind.BENCHMARK,
        label: BENCHMARK_LABEL,
        points: walk(BENCHMARK_ID, endpoint.benchmark),
        reason: null,
      },
      index,
    ],
    windowStart,
  };
}

/**
 * Builds one set of the four multiples. Coverage is derived from the book;
 * below the dash tier the multiple is withheld and replaced with a reason.
 */
function fourPriceSet(
  book: Book,
  multiples: { div: number; ern: number; fcf: number; rev: number },
  coverageOf: (predicate: Predicate) => number
): FourPriceSet {
  const totalHoldings = investedHoldings(book.holdings).length;
  const floor = Math.round(COVERAGE_DASH_THRESHOLD * PERCENTAGE_POINTS);

  const value = (multiple: number, predicate: Predicate): FourPriceValue => {
    const coverage = coverageOf(predicate);
    const suppressed = coverageTier(coverage) === 'DASH';
    const covered = Math.round(coverage * PERCENTAGE_POINTS);

    return {
      coverageWeight: coverage,
      coveredHoldings: countCovered(book.holdings, predicate),
      multiple: suppressed ? null : multiple,
      reason: suppressed
        ? `Coverage of ${covered}% of weight is below the ${floor}% floor`
        : null,
      totalHoldings,
    };
  };

  return {
    div: value(multiples.div, paysDividend),
    ern: value(multiples.ern, allInvested),
    fcf: value(multiples.fcf, hasFcf),
    rev: value(multiples.rev, allInvested),
  };
}

function toRanking(inputs: RankingInputs): FourPriceRanking {
  const stat = ([
    percentile,
    zScore,
    universeMean,
    universeStdDev,
  ]: RankingInputs['rev']): RankStat => ({
    percentile,
    reason: null,
    universeMean,
    universeStdDev,
    zScore,
  });

  return {
    constituents: inputs.constituents,
    div: stat(inputs.div),
    ern: stat(inputs.ern),
    fcf: stat(inputs.fcf),
    rev: stat(inputs.rev),
    universe: inputs.universe,
  };
}

function fourPrice(book: Book): FourPricePayload {
  const { fourPrice: inputs, holdings } = book;
  return {
    asOf: book.asOf,
    byTargetWeight: fourPriceSet(book, inputs.byTargetWeight, (predicate) =>
      coverageByWeight(holdings, predicate)
    ),
    byWeightedEr: fourPriceSet(book, inputs.byWeightedEr, (predicate) =>
      coverageByWeightedEr(holdings, predicate)
    ),
    vsIndex: toRanking(inputs.vsIndex),
    vsSp500: toRanking(inputs.vsSp500),
  };
}

function risk(book: Book): RiskPayload {
  const { risk: inputs } = book;
  const garch = inputs.garchVolDaily;
  const toPair = ([a, b, rho]: [string, string, number]) => ({ a, b, rho });

  return {
    asOf: book.asOf,
    bottomCorrelations: inputs.bottomCorrelations.map(toPair),
    es95: inputs.es95,
    es95TenDay: tenDay(inputs.es95),
    es99: inputs.es99,
    es99TenDay: tenDay(inputs.es99),
    garchReason: garch === null ? (inputs.garchReason ?? null) : null,
    garchVolAnnualized: garch === null ? null : annualizeDailyVol(garch),
    garchVolDaily: garch,
    requestedWindowDays: inputs.requestedWindowDays,
    topCorrelations: inputs.topCorrelations.map(toPair),
    var95: inputs.var95,
    var95TenDay: tenDay(inputs.var95),
    var99: inputs.var99,
    var99TenDay: tenDay(inputs.var99),
    weightedVolAnnualized: weightedVolAnnualized(book.holdings),
    weightedVolCoverage: investedWeight(book.holdings),
    windowDays: inputs.windowDays,
    windowNote: inputs.windowNote ?? null,
  };
}

/**
 * A holding's since-trade move. Current weight is rounded before the drift is
 * computed, so the drift shown matches the two weights shown beside it.
 */
function toMover(entry: Contribution, weights: Map<string, number>): Mover {
  const { holding } = entry;
  const currentWeight = roundTo(
    weights.get(holding.ticker) ?? 0,
    WEIGHT_DECIMALS
  );
  const drift = (currentWeight - holding.targetWeight) * PERCENTAGE_POINTS;

  return {
    contribution: entry.contribution,
    currentWeight,
    driftPp: roundTo(drift, DRIFT_DECIMALS),
    name: holding.name,
    returnSinceTrade: holding.returnSinceTrade,
    targetWeight: holding.targetWeight,
    ticker: holding.ticker,
  };
}

function movers(book: Book, count: number): MoversPayload {
  if (book.tradeDate === null) {
    return {
      asOf: book.asOf,
      attribution: null,
      baselineDate: null,
      bottom: [],
      reason: NO_TRADE_DATE_MOVERS,
      top: [],
      tradeDate: null,
    };
  }

  const weights = currentWeights(book.holdings);
  const shares = attributionShares(book.holdings, count);
  const toRow = (entry: Contribution): Mover => toMover(entry, weights);

  return {
    asOf: book.asOf,
    attribution: {
      bottomShare: shares.bottomShare,
      portfolioReturn: reportedReturnSinceTrade(book.holdings),
      reason: shares.reason ?? null,
      topShare: shares.topShare,
    },
    baselineDate: book.tradeDate,
    bottom: bottomContributions(book.holdings, count).map(toRow),
    reason: null,
    top: topContributions(book.holdings, count).map(toRow),
    tradeDate: book.tradeDate,
  };
}

function toErContributor(entry: Contribution): ErContributor {
  const { holding } = entry;
  return {
    contribution: entry.contribution,
    er: expectedReturn(holding) ?? 0,
    price: holding.price ?? 0,
    priceTarget: holding.priceTarget ?? 0,
    targetWeight: holding.targetWeight,
    ticker: holding.ticker,
  };
}

function expectedReturnPayload(
  book: Book,
  count: number
): ExpectedReturnPayload {
  const ranked = erContributions(book.holdings);
  const bottom = count === 0 ? [] : ranked.slice(-count).reverse();

  return {
    asOf: book.asOf,
    bottomContributors: bottom.map(toErContributor),
    coveredWeight: erCoveredWeight(book.holdings),
    noTarget: tickersWithoutTarget(book.holdings),
    portfolioEr: portfolioExpectedReturn(book.holdings),
    stalePriceTargets: {
      count: book.staleTargets.length,
      tickers: book.staleTargets,
    },
    topContributors: ranked.slice(0, count).map(toErContributor),
  };
}

function deployment(book: Book): DeploymentPayload {
  const { deployment: inputs } = book;
  return {
    accountsCount: inputs.accountsCount,
    asOf: book.asOf,
    aum: {
      asOf: book.asOf,
      reason: inputs.aum === null ? NO_AUM_REASON : null,
      source: inputs.aumSource,
      value: inputs.aum,
    },
    clientsCount: inputs.clientsCount,
    gainLoss: inputs.gainLoss.map((entry) => ({
      horizon: entry.horizon,
      pct: entry.pct,
      reason: entry.reason ?? null,
      value: entry.value,
    })),
  };
}

/**
 * Treemap data. SINCE_TRADE shows since-trade returns; every other horizon
 * shows YTD returns, the only other per-holding return the sample data has.
 */
function sectorWeights(
  book: Book,
  horizon: DashboardHorizon
): SectorWeightsPayload {
  const returnOf =
    horizon === DashboardHorizon.SINCE_TRADE ? sinceTradeReturnOf : ytdReturnOf;
  const benchmarkReturn = endpointFor(book, horizon).benchmark;

  return {
    asOf: book.asOf,
    benchmarkReturn,
    holdings: book.holdings.map((holding) => ({
      isCash: holding.isCash,
      name: holding.name,
      return: returnOf(holding),
      sector: holding.sector,
      ticker: holding.ticker,
      weight: holding.targetWeight,
    })),
    horizon,
    sectors: sectorRollups(book.holdings, benchmarkReturn, returnOf),
  };
}

export const resolvers: Resolvers = {
  Query: {
    dashboardPortfolios: () => BOOKS.map(toPortfolio),
    deploymentSummary: (_parent, { portfolioId }) =>
      deployment(bookFor(portfolioId)),
    portfolioDashboardSummary: (_parent, { portfolioId }) =>
      summary(bookFor(portfolioId)),
    portfolioExpectedReturn: (_parent, { count, portfolioId }) =>
      expectedReturnPayload(bookFor(portfolioId), normaliseCount(count)),
    portfolioFourPrice: (_parent, { portfolioId }) =>
      fourPrice(bookFor(portfolioId)),
    portfolioMovers: (_parent, { count, portfolioId }) =>
      movers(bookFor(portfolioId), normaliseCount(count)),
    portfolioPriceSeries: (_parent, { horizon, portfolioId }) =>
      priceSeries(bookFor(portfolioId), horizon),
    portfolioRisk: (_parent, { portfolioId }) => risk(bookFor(portfolioId)),
    portfolioSectorWeights: (_parent, { horizon, portfolioId }) =>
      sectorWeights(bookFor(portfolioId), horizon),
  },
};
