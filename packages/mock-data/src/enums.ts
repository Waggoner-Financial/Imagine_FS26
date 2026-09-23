// Each enum is a const object (for runtime values such as
// `DashboardHorizon.YTD`) plus a same-named string union type. The string
// values match the GraphQL enum values in apps/mock-api/schema.graphql
// exactly, so these line up with the types graphql-codegen generates.

/**
 * Horizons the dashboard can be viewed over. ALL anchors to the portfolio's
 * inception date, not to the earliest date every series has data.
 */
export const DashboardHorizon = {
  ONE_DAY: 'ONE_DAY',
  ONE_MONTH: 'ONE_MONTH',
  ONE_YEAR: 'ONE_YEAR',
  YTD: 'YTD',
  ALL: 'ALL',
  SINCE_TRADE: 'SINCE_TRADE',
} as const;
export type DashboardHorizon =
  (typeof DashboardHorizon)[keyof typeof DashboardHorizon];

/** The five sample model portfolios the dashboard selector offers. */
export const ModelPortfolioCode = {
  EQUITY: 'EQUITY',
  EARNINGS: 'EARNINGS',
  DIVIDEND: 'DIVIDEND',
  FCF: 'FCF',
  REVENUE: 'REVENUE',
} as const;
export type ModelPortfolioCode =
  (typeof ModelPortfolioCode)[keyof typeof ModelPortfolioCode];

/** Which line of a Price Action chart a series represents. */
export const SeriesKind = {
  PORTFOLIO: 'PORTFOLIO',
  BENCHMARK: 'BENCHMARK',
  INDEX: 'INDEX',
} as const;
export type SeriesKind = (typeof SeriesKind)[keyof typeof SeriesKind];

/**
 * Where a deployment AUM figure came from: the portfolio accounting system,
 * or a figure someone entered by hand.
 */
export const AumSource = {
  ACCOUNTING_SYSTEM: 'ACCOUNTING_SYSTEM',
  MANUAL: 'MANUAL',
} as const;
export type AumSource = (typeof AumSource)[keyof typeof AumSource];
