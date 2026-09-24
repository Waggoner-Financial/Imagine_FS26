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