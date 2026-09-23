import type { Holding } from './book.types';

export const TRADING_DAYS_PER_YEAR = 252;
export const TEN_DAY_HORIZON_DAYS = 10;

/** Below this share of weight the UI greys a 4P multiple (Definitions #12). */
export const COVERAGE_GREY_THRESHOLD = 0.5;
/** Below this share the multiple is suppressed entirely and the UI dashes it. */
export const COVERAGE_DASH_THRESHOLD = 0.25;

/**
 * A portfolio return this small makes an attribution share meaningless — the
 * denominator is noise. The FCF book sits at 0.0004 to exercise that path.
 */
export const FLAT_PORTFOLIO_EPSILON = 0.001;

/**
 * Figures are reported to four decimals, and the spec's derived shares divide
 * by the *reported* return (0.0251), not the raw sum (0.025060). Rounding the
 * denominator here is what makes topShare land on the spec's 0.855 rather than
 * 0.857, so the API returns the figure the spec publishes.
 */
export const REPORTED_DECIMALS = 4;

export type Contribution = {
  contribution: number;
  holding: Holding;
};

export type SectorRollup = {
  holdings: string[];
  isCash: boolean;
  name: string;
  return: number | null;
  vsBenchmark: number | null;
  weight: number;
};

export type AttributionShares = {
  bottomShare: number | null;
  reason?: string;
  topShare: number | null;
};

export type CoverageTier = 'DASH' | 'FULL' | 'GREY';

/** Picks the return a panel is showing; null where the holding has none. */
export type ReturnSelector = (holding: Holding) => number | null;

export const sum = (values: number[]): number =>
  values.reduce((total, value) => total + value, 0);

export const roundTo = (value: number, decimals: number): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

/** Raw upside, (PT - price) / price. Null when it cannot be computed at all. */
export const expectedReturn = (holding: Holding): number | null => {
  if (holding.isCash || holding.price === null || holding.priceTarget === null)
    return null;
  if (holding.price === 0) return null;
  return (holding.priceTarget - holding.price) / holding.price;
};

export const investedHoldings = (holdings: Holding[]): Holding[] =>
  holdings.filter((holding) => !holding.isCash);

export const totalWeight = (holdings: Holding[]): number =>
  sum(holdings.map((holding) => holding.targetWeight));

export const investedWeight = (holdings: Holding[]): number =>
  totalWeight(investedHoldings(holdings));

export const contributionsSinceTrade = (holdings: Holding[]): Contribution[] =>
  investedHoldings(holdings).map((holding) => ({
    contribution: holding.targetWeight * holding.returnSinceTrade,
    holding,
  }));

export const portfolioReturnSinceTrade = (holdings: Holding[]): number =>
  sum(contributionsSinceTrade(holdings).map((entry) => entry.contribution));

export const reportedReturnSinceTrade = (holdings: Holding[]): number =>
  roundTo(portfolioReturnSinceTrade(holdings), REPORTED_DECIMALS);

/** Descending by contribution — top movers first, bottom movers last. */
export const rankedContributions = (holdings: Holding[]): Contribution[] =>
  [...contributionsSinceTrade(holdings)].sort(
    (a, b) => b.contribution - a.contribution
  );

export const topContributions = (
  holdings: Holding[],
  count: number
): Contribution[] =>
  count <= 0 ? [] : rankedContributions(holdings).slice(0, count);

/**
 * Ascending — most negative first, matching the spec's bottom-movers order.
 * The count guard matters: `slice(-0)` is `slice(0)`, which would return every
 * holding instead of none.
 */
export const bottomContributions = (
  holdings: Holding[],
  count: number
): Contribution[] =>
  count <= 0 ? [] : rankedContributions(holdings).slice(-count).reverse();

export const attributionShares = (
  holdings: Holding[],
  count: number
): AttributionShares => {
  const portfolioReturn = reportedReturnSinceTrade(holdings);

  if (Math.abs(portfolioReturn) < FLAT_PORTFOLIO_EPSILON) {
    return {
      bottomShare: null,
      reason: 'n/a (portfolio flat)',
      topShare: null,
    };
  }

  const shareOf = (entries: Contribution[]): number =>
    sum(entries.map((entry) => entry.contribution)) / portfolioReturn;

  return {
    bottomShare: shareOf(bottomContributions(holdings, count)),
    topShare: shareOf(topContributions(holdings, count)),
  };
};

/** Holdings whose ER can be computed at all — excludes cash and no-target names. */
export const holdingsWithEr = (holdings: Holding[]): Holding[] =>
  holdings.filter((holding) => expectedReturn(holding) !== null);

export const erCoveredWeight = (holdings: Holding[]): number =>
  totalWeight(holdingsWithEr(holdings));

export const portfolioExpectedReturn = (holdings: Holding[]): number =>
  sum(
    holdingsWithEr(holdings).map(
      (holding) => holding.targetWeight * (expectedReturn(holding) ?? 0)
    )
  );

export const erContributions = (holdings: Holding[]): Contribution[] =>
  holdingsWithEr(holdings)
    .map((holding) => ({
      contribution: holding.targetWeight * (expectedReturn(holding) ?? 0),
      holding,
    }))
    .sort((a, b) => b.contribution - a.contribution);

export const tickersWithoutTarget = (holdings: Holding[]): string[] =>
  investedHoldings(holdings)
    .filter((holding) => holding.priceTarget === null)
    .map((holding) => holding.ticker);

/**
 * TW x ER renormalized, dropping any holding with ER <= 0. A holding priced at
 * or above its target would otherwise take a negative weight and leave the
 * weighted harmonic mean undefined (docs/spec.md, Definitions #2).
 */
export const weightedErWeights = (holdings: Holding[]): Map<string, number> => {
  const eligible = holdingsWithEr(holdings).filter((holding) => {
    const er = expectedReturn(holding);
    return er !== null && er > 0;
  });

  const raw = eligible.map((holding) => ({
    ticker: holding.ticker,
    weight: holding.targetWeight * (expectedReturn(holding) ?? 0),
  }));

  const total = sum(raw.map((entry) => entry.weight));
  if (total === 0) return new Map<string, number>();

  return new Map(raw.map((entry) => [entry.ticker, entry.weight / total]));
};

export const coverageByWeight = (
  holdings: Holding[],
  predicate: (holding: Holding) => boolean
): number => totalWeight(investedHoldings(holdings).filter(predicate));

export const coverageByWeightedEr = (
  holdings: Holding[],
  predicate: (holding: Holding) => boolean
): number => {
  const weights = weightedErWeights(holdings);
  return sum(
    investedHoldings(holdings)
      .filter(predicate)
      .map((holding) => weights.get(holding.ticker) ?? 0)
  );
};

export const countCovered = (
  holdings: Holding[],
  predicate: (holding: Holding) => boolean
): number => investedHoldings(holdings).filter(predicate).length;

export const coverageTier = (coverage: number): CoverageTier => {
  if (coverage < COVERAGE_DASH_THRESHOLD) return 'DASH';
  if (coverage < COVERAGE_GREY_THRESHOLD) return 'GREY';
  return 'FULL';
};

export const ytdReturnOf: ReturnSelector = (holding) => holding.ytdReturn;

export const sinceTradeReturnOf: ReturnSelector = (holding) =>
  holding.isCash ? null : holding.returnSinceTrade;

/** Target-weighted return over whichever holdings the selector can price. */
export const weightedReturn = (
  holdings: Holding[],
  returnOf: ReturnSelector
): number =>
  sum(
    holdings
      .filter((holding) => returnOf(holding) !== null)
      .map((holding) => holding.targetWeight * (returnOf(holding) ?? 0))
  );

/**
 * Weights after each holding has grown by its since-trade return, renormalized.
 * The gap against target weight is what the Drift panel reports.
 */
export const currentWeights = (holdings: Holding[]): Map<string, number> => {
  const grown = holdings.map((holding) => ({
    ticker: holding.ticker,
    value: holding.targetWeight * (1 + holding.returnSinceTrade),
  }));

  const total = sum(grown.map((entry) => entry.value));
  if (total === 0) return new Map<string, number>();

  return new Map(grown.map((entry) => [entry.ticker, entry.value / total]));
};

export const weightedVolAnnualized = (holdings: Holding[]): number =>
  sum(
    investedHoldings(holdings).map(
      (holding) => holding.targetWeight * holding.volAnnualized
    )
  );

export const tenDay = (oneDay: number): number =>
  oneDay * Math.sqrt(TEN_DAY_HORIZON_DAYS);

export const annualizeDailyVol = (daily: number): number =>
  daily * Math.sqrt(TRADING_DAYS_PER_YEAR);

/** Weight and weight-average return per sector, heaviest first, cash last. */
export const sectorRollups = (
  holdings: Holding[],
  benchmarkReturn: number,
  returnOf: ReturnSelector
): SectorRollup[] => {
  const bySector = new Map<string, Holding[]>();

  for (const holding of holdings) {
    const bucket = bySector.get(holding.sector);
    if (bucket === undefined) bySector.set(holding.sector, [holding]);
    else bucket.push(holding);
  }

  const rollups = [...bySector.entries()].map(([name, members]) => {
    const withReturn = members.filter((holding) => returnOf(holding) !== null);
    const coveredWeight = totalWeight(withReturn);
    const sectorReturn =
      coveredWeight === 0
        ? null
        : weightedReturn(withReturn, returnOf) / coveredWeight;

    return {
      holdings: members.map((holding) => holding.ticker),
      isCash: members.every((holding) => holding.isCash),
      name,
      return: sectorReturn,
      vsBenchmark:
        sectorReturn === null ? null : sectorReturn - benchmarkReturn,
      weight: totalWeight(members),
    };
  });

  return rollups.sort((a, b) => {
    if (a.isCash !== b.isCash) return a.isCash ? 1 : -1;
    return b.weight - a.weight;
  });
};
