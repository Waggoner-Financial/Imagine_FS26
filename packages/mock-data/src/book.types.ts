import type { AumSource, DashboardHorizon, ModelPortfolioCode } from './enums';

export const SECTOR_CASH = 'Cash';

/**
 * One row of a sample book, in the same column order as the table in §5 of
 * docs/spec.md. A named tuple rather than an object so each holding reads as
 * one table row and can be checked against the spec line by line; toHolding
 * turns it into a Holding object.
 */
export type HoldingRow = [
  ticker: string,
  name: string,
  sector: string,
  targetWeight: number,
  price: number | null,
  priceTarget: number | null,
  returnSinceTrade: number,
  volAnnualized: number,
  paysDividend: boolean,
  ytdReturn: number | null,
  hasFcfData?: boolean,
];

export type Holding = {
  /** False only where a holding has no usable free-cash-flow multiple. */
  hasFcfData: boolean;
  isCash: boolean;
  name: string;
  paysDividend: boolean;
  price: number | null;
  priceTarget: number | null;
  returnSinceTrade: number;
  sector: string;
  targetWeight: number;
  ticker: string;
  volAnnualized: number;
  ytdReturn: number | null;
};

/** A price target older than the company's last earnings date. */
export type StaleTargetRow = {
  lastEarningsDate: string;
  priceTargetDate: string;
  ticker: string;
};

/**
 * Risk figures that cannot be derived from the book. VaR, ES and the
 * correlation pairs would come from a risk model run over years of price
 * history, which this sample data does not have, so they are stated directly.
 * Everything that follows from them — ten-day scaling, GARCH annualisation,
 * weighted volatility and its coverage — is computed in derive.ts.
 */
export type RiskInputs = {
  bottomCorrelations: [string, string, number][];
  es95: number;
  es99: number;
  garchReason?: string;
  garchVolDaily: number | null;
  requestedWindowDays: number;
  topCorrelations: [string, string, number][];
  var95: number;
  var99: number;
  windowDays: number;
  windowNote?: string;
};

/**
 * Price multiples and universe rankings are stated (they would come from a
 * market-data feed); how much of the book each multiple covers is derived.
 */
export type FourPriceInputs = {
  byTargetWeight: { div: number; ern: number; fcf: number; rev: number };
  byWeightedEr: { div: number; ern: number; fcf: number; rev: number };
  vsIndex: RankingInputs;
  vsSp500: RankingInputs;
};

export type RankingInputs = {
  constituents: number;
  div: [percentile: number, zScore: number, mean: number, stdDev: number];
  ern: [percentile: number, zScore: number, mean: number, stdDev: number];
  fcf: [percentile: number, zScore: number, mean: number, stdDev: number];
  rev: [percentile: number, zScore: number, mean: number, stdDev: number];
  universe: string;
};

export type GainLossInput = {
  horizon: DashboardHorizon;
  pct: number | null;
  reason?: string;
  value: number | null;
};

export type DeploymentInputs = {
  accountsCount: number;
  aum: number | null;
  aumSource: AumSource;
  clientsCount: number;
  gainLoss: GainLossInput[];
};

/**
 * Where a horizon's lines end. SINCE_TRADE and YTD are derived from the book,
 * so only the horizons the book cannot imply are stated here.
 */
export type HorizonEndpoint = {
  benchmark: number;
  horizon: DashboardHorizon;
  portfolio: number;
};

export type SeriesInputs = {
  /** Cumulative return the benchmark line ends at over SINCE_TRADE. */
  benchmarkSinceTrade: number;
  /** Endpoints for the horizons the book cannot derive. */
  endpoints: HorizonEndpoint[];
  /** Earliest date the portfolio series has a value — the ALL anchor. */
  inception: string;
  /** Why the index line comes back empty. */
  indexReason: string;
};

export type Book = {
  asOf: string;
  code: ModelPortfolioCode;
  deployment: DeploymentInputs;
  fourPrice: FourPriceInputs;
  holdings: Holding[];
  id: string;
  name: string;
  risk: RiskInputs;
  series: SeriesInputs;
  staleTargets: StaleTargetRow[];
  /** Null exercises the "trade date not set" empty state. */
  tradeDate: string | null;
  /** S&P 500 return over the YTD horizon, for the treemap's vsBenchmark. */
  ytdBenchmarkReturn: number;
};

/** Expands a table row into a Holding. Cash rows are flagged by sector. */
export const toHolding = (row: HoldingRow): Holding => {
  const [
    ticker,
    name,
    sector,
    targetWeight,
    price,
    priceTarget,
    returnSinceTrade,
    volAnnualized,
    paysDividend,
    ytdReturn,
    hasFcfData,
  ] = row;

  return {
    hasFcfData: hasFcfData ?? sector !== SECTOR_CASH,
    isCash: sector === SECTOR_CASH,
    name,
    paysDividend,
    price,
    priceTarget,
    returnSinceTrade,
    sector,
    targetWeight,
    ticker,
    volAnnualized,
    ytdReturn,
  };
};
