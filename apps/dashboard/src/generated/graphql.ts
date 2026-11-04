/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
/** Where an AUM figure came from. */
export type AumSource =
  | 'ACCOUNTING_SYSTEM'
  | 'MANUAL';

/**
 * Horizons the dashboard can be viewed over. ALL starts at the portfolio's
 * inception date; SINCE_TRADE starts at its last trade date.
 */
export type DashboardHorizon =
  | 'ALL'
  | 'ONE_DAY'
  | 'ONE_MONTH'
  | 'ONE_YEAR'
  | 'SINCE_TRADE'
  | 'YTD';

export type ModelPortfolioCode =
  | 'DIVIDEND'
  | 'EARNINGS'
  | 'EQUITY'
  | 'FCF'
  | 'REVENUE';

export type PortfoliosQueryVariables = Exact<{ [key: string]: never; }>;


export type PortfoliosQuery = { dashboardPortfolios: Array<{ id: string, code: ModelPortfolioCode, name: string }> };

export type SummaryQueryVariables = Exact<{
  portfolioId: string | number;
}>;


export type SummaryQuery = { portfolioDashboardSummary: { holdingsCount: number, tradeDate: string | null, asOf: string, returnSinceTrade: { baselineDate: string, latestDate: string, returnPct: number, flowAdjusted: boolean } | null } };

export type DeploymentQueryVariables = Exact<{
  portfolioId: string | number;
}>;


export type DeploymentQuery = { deploymentSummary: { accountsCount: number, clientsCount: number, asOf: string, aum: { value: number | null, source: AumSource, reason: string | null }, gainLoss: Array<{ horizon: DashboardHorizon, value: number | null, pct: number | null, reason: string | null }> } };

export type SectorWeightsQueryVariables = Exact<{
  portfolioId: string | number;
  horizon: DashboardHorizon;
}>;


export type SectorWeightsQuery = { portfolioSectorWeights: { horizon: DashboardHorizon, benchmarkReturn: number, asOf: string, sectors: Array<{ name: string, weight: number, return: number | null, vsBenchmark: number | null, isCash: boolean, holdings: Array<string> }>, holdings: Array<{ ticker: string, name: string, sector: string, weight: number, return: number | null, isCash: boolean }> } };

export type FourPriceQueryVariables = Exact<{
  portfolioId: string | number;
}>;


export type FourPriceQuery = { portfolioFourPrice: { asOf: string, byTargetWeight: { rev: { multiple: number | null, coverageWeight: number, coveredHoldings: number, totalHoldings: number, reason: string | null }, fcf: { multiple: number | null, coverageWeight: number, coveredHoldings: number, totalHoldings: number, reason: string | null }, ern: { multiple: number | null, coverageWeight: number, coveredHoldings: number, totalHoldings: number, reason: string | null }, div: { multiple: number | null, coverageWeight: number, coveredHoldings: number, totalHoldings: number, reason: string | null } }, byWeightedEr: { rev: { multiple: number | null, coverageWeight: number, coveredHoldings: number, totalHoldings: number, reason: string | null }, fcf: { multiple: number | null, coverageWeight: number, coveredHoldings: number, totalHoldings: number, reason: string | null }, ern: { multiple: number | null, coverageWeight: number, coveredHoldings: number, totalHoldings: number, reason: string | null }, div: { multiple: number | null, coverageWeight: number, coveredHoldings: number, totalHoldings: number, reason: string | null } }, vsSp500: { universe: string, constituents: number, rev: { percentile: number | null, zScore: number | null, universeMean: number | null, universeStdDev: number | null, reason: string | null }, fcf: { percentile: number | null, zScore: number | null, universeMean: number | null, universeStdDev: number | null, reason: string | null }, ern: { percentile: number | null, zScore: number | null, universeMean: number | null, universeStdDev: number | null, reason: string | null }, div: { percentile: number | null, zScore: number | null, universeMean: number | null, universeStdDev: number | null, reason: string | null } }, vsIndex: { universe: string, constituents: number, rev: { percentile: number | null, zScore: number | null, universeMean: number | null, universeStdDev: number | null, reason: string | null }, fcf: { percentile: number | null, zScore: number | null, universeMean: number | null, universeStdDev: number | null, reason: string | null }, ern: { percentile: number | null, zScore: number | null, universeMean: number | null, universeStdDev: number | null, reason: string | null }, div: { percentile: number | null, zScore: number | null, universeMean: number | null, universeStdDev: number | null, reason: string | null } } } };

export type FourPriceValueFieldsFragment = { multiple: number | null, coverageWeight: number, coveredHoldings: number, totalHoldings: number, reason: string | null };

export type FourPriceSetFieldsFragment = { rev: { multiple: number | null, coverageWeight: number, coveredHoldings: number, totalHoldings: number, reason: string | null }, fcf: { multiple: number | null, coverageWeight: number, coveredHoldings: number, totalHoldings: number, reason: string | null }, ern: { multiple: number | null, coverageWeight: number, coveredHoldings: number, totalHoldings: number, reason: string | null }, div: { multiple: number | null, coverageWeight: number, coveredHoldings: number, totalHoldings: number, reason: string | null } };

export type RankStatFieldsFragment = { percentile: number | null, zScore: number | null, universeMean: number | null, universeStdDev: number | null, reason: string | null };

export type FourPriceRankingFieldsFragment = { universe: string, constituents: number, rev: { percentile: number | null, zScore: number | null, universeMean: number | null, universeStdDev: number | null, reason: string | null }, fcf: { percentile: number | null, zScore: number | null, universeMean: number | null, universeStdDev: number | null, reason: string | null }, ern: { percentile: number | null, zScore: number | null, universeMean: number | null, universeStdDev: number | null, reason: string | null }, div: { percentile: number | null, zScore: number | null, universeMean: number | null, universeStdDev: number | null, reason: string | null } };

export type MoversQueryVariables = Exact<{
  portfolioId: string | number;
}>;


export type MoversQuery = { portfolioMovers: { tradeDate: string | null, baselineDate: string | null, asOf: string, reason: string | null, top: Array<{ ticker: string, name: string, returnSinceTrade: number, targetWeight: number, currentWeight: number, driftPp: number, contribution: number }>, bottom: Array<{ ticker: string, name: string, returnSinceTrade: number, targetWeight: number, currentWeight: number, driftPp: number, contribution: number }>, attribution: { portfolioReturn: number, topShare: number | null, bottomShare: number | null, reason: string | null } | null } };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: NonNullable<DocumentTypeDecoration<TResult, TVariables>['__apiType']>;
  private value: string;
  public __meta__?: Record<string, any> | undefined;

  constructor(value: string, __meta__?: Record<string, any> | undefined) {
    super(value);
    this.value = value;
    this.__meta__ = __meta__;
  }

  override toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}
export const FourPriceValueFieldsFragmentDoc = new TypedDocumentString(`
    fragment FourPriceValueFields on FourPriceValue {
  multiple
  coverageWeight
  coveredHoldings
  totalHoldings
  reason
}
    `, {"fragmentName":"FourPriceValueFields"}) as unknown as TypedDocumentString<FourPriceValueFieldsFragment, unknown>;
export const FourPriceSetFieldsFragmentDoc = new TypedDocumentString(`
    fragment FourPriceSetFields on FourPriceSet {
  rev {
    ...FourPriceValueFields
  }
  fcf {
    ...FourPriceValueFields
  }
  ern {
    ...FourPriceValueFields
  }
  div {
    ...FourPriceValueFields
  }
}
    fragment FourPriceValueFields on FourPriceValue {
  multiple
  coverageWeight
  coveredHoldings
  totalHoldings
  reason
}`, {"fragmentName":"FourPriceSetFields"}) as unknown as TypedDocumentString<FourPriceSetFieldsFragment, unknown>;
export const RankStatFieldsFragmentDoc = new TypedDocumentString(`
    fragment RankStatFields on RankStat {
  percentile
  zScore
  universeMean
  universeStdDev
  reason
}
    `, {"fragmentName":"RankStatFields"}) as unknown as TypedDocumentString<RankStatFieldsFragment, unknown>;
export const FourPriceRankingFieldsFragmentDoc = new TypedDocumentString(`
    fragment FourPriceRankingFields on FourPriceRanking {
  universe
  constituents
  rev {
    ...RankStatFields
  }
  fcf {
    ...RankStatFields
  }
  ern {
    ...RankStatFields
  }
  div {
    ...RankStatFields
  }
}
    fragment RankStatFields on RankStat {
  percentile
  zScore
  universeMean
  universeStdDev
  reason
}`, {"fragmentName":"FourPriceRankingFields"}) as unknown as TypedDocumentString<FourPriceRankingFieldsFragment, unknown>;
export const PortfoliosDocument = new TypedDocumentString(`
    query Portfolios {
  dashboardPortfolios {
    id
    code
    name
  }
}
    `) as unknown as TypedDocumentString<PortfoliosQuery, PortfoliosQueryVariables>;
export const SummaryDocument = new TypedDocumentString(`
    query Summary($portfolioId: ID!) {
  portfolioDashboardSummary(portfolioId: $portfolioId) {
    holdingsCount
    tradeDate
    asOf
    returnSinceTrade {
      baselineDate
      latestDate
      returnPct
      flowAdjusted
    }
  }
}
    `) as unknown as TypedDocumentString<SummaryQuery, SummaryQueryVariables>;
export const DeploymentDocument = new TypedDocumentString(`
    query Deployment($portfolioId: ID!) {
  deploymentSummary(portfolioId: $portfolioId) {
    accountsCount
    clientsCount
    asOf
    aum {
      value
      source
      reason
    }
    gainLoss {
      horizon
      value
      pct
      reason
    }
  }
}
    `) as unknown as TypedDocumentString<DeploymentQuery, DeploymentQueryVariables>;
export const SectorWeightsDocument = new TypedDocumentString(`
    query SectorWeights($portfolioId: ID!, $horizon: DashboardHorizon!) {
  portfolioSectorWeights(portfolioId: $portfolioId, horizon: $horizon) {
    horizon
    benchmarkReturn
    asOf
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
  }
}
    `) as unknown as TypedDocumentString<SectorWeightsQuery, SectorWeightsQueryVariables>;
export const FourPriceDocument = new TypedDocumentString(`
    query FourPrice($portfolioId: ID!) {
  portfolioFourPrice(portfolioId: $portfolioId) {
    asOf
    byTargetWeight {
      ...FourPriceSetFields
    }
    byWeightedEr {
      ...FourPriceSetFields
    }
    vsSp500 {
      ...FourPriceRankingFields
    }
    vsIndex {
      ...FourPriceRankingFields
    }
  }
}
    fragment FourPriceValueFields on FourPriceValue {
  multiple
  coverageWeight
  coveredHoldings
  totalHoldings
  reason
}
fragment FourPriceSetFields on FourPriceSet {
  rev {
    ...FourPriceValueFields
  }
  fcf {
    ...FourPriceValueFields
  }
  ern {
    ...FourPriceValueFields
  }
  div {
    ...FourPriceValueFields
  }
}
fragment RankStatFields on RankStat {
  percentile
  zScore
  universeMean
  universeStdDev
  reason
}
fragment FourPriceRankingFields on FourPriceRanking {
  universe
  constituents
  rev {
    ...RankStatFields
  }
  fcf {
    ...RankStatFields
  }
  ern {
    ...RankStatFields
  }
  div {
    ...RankStatFields
  }
}`) as unknown as TypedDocumentString<FourPriceQuery, FourPriceQueryVariables>;
export const MoversDocument = new TypedDocumentString(`
    query Movers($portfolioId: ID!) {
  portfolioMovers(portfolioId: $portfolioId, count: 3) {
    tradeDate
    baselineDate
    asOf
    reason
    top {
      ticker
      name
      returnSinceTrade
      targetWeight
      currentWeight
      driftPp
      contribution
    }
    bottom {
      ticker
      name
      returnSinceTrade
      targetWeight
      currentWeight
      driftPp
      contribution
    }
    attribution {
      portfolioReturn
      topShare
      bottomShare
      reason
    }
  }
}
    `) as unknown as TypedDocumentString<MoversQuery, MoversQueryVariables>;