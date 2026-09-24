/* eslint-disable */
import * as types from './graphql';



/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query Portfolios {\n    dashboardPortfolios {\n      id\n      code\n      name\n    }\n  }\n": typeof types.PortfoliosDocument,
    "\n  query Summary($portfolioId: ID!) {\n    portfolioDashboardSummary(portfolioId: $portfolioId) {\n      holdingsCount\n      tradeDate\n      asOf\n      returnSinceTrade {\n        baselineDate\n        latestDate\n        returnPct\n        flowAdjusted\n      }\n    }\n  }\n": typeof types.SummaryDocument,
    "\n  query Deployment($portfolioId: ID!) {\n    deploymentSummary(portfolioId: $portfolioId) {\n      accountsCount\n      clientsCount\n      asOf\n      aum {\n        value\n        source\n        reason\n      }\n      gainLoss {\n        horizon\n        value\n        pct\n        reason\n      }\n    }\n  }\n": typeof types.DeploymentDocument,
};
const documents: Documents = {
    "\n  query Portfolios {\n    dashboardPortfolios {\n      id\n      code\n      name\n    }\n  }\n": types.PortfoliosDocument,
    "\n  query Summary($portfolioId: ID!) {\n    portfolioDashboardSummary(portfolioId: $portfolioId) {\n      holdingsCount\n      tradeDate\n      asOf\n      returnSinceTrade {\n        baselineDate\n        latestDate\n        returnPct\n        flowAdjusted\n      }\n    }\n  }\n": types.SummaryDocument,
    "\n  query Deployment($portfolioId: ID!) {\n    deploymentSummary(portfolioId: $portfolioId) {\n      accountsCount\n      clientsCount\n      asOf\n      aum {\n        value\n        source\n        reason\n      }\n      gainLoss {\n        horizon\n        value\n        pct\n        reason\n      }\n    }\n  }\n": types.DeploymentDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Portfolios {\n    dashboardPortfolios {\n      id\n      code\n      name\n    }\n  }\n"): typeof import('./graphql').PortfoliosDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Summary($portfolioId: ID!) {\n    portfolioDashboardSummary(portfolioId: $portfolioId) {\n      holdingsCount\n      tradeDate\n      asOf\n      returnSinceTrade {\n        baselineDate\n        latestDate\n        returnPct\n        flowAdjusted\n      }\n    }\n  }\n"): typeof import('./graphql').SummaryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Deployment($portfolioId: ID!) {\n    deploymentSummary(portfolioId: $portfolioId) {\n      accountsCount\n      clientsCount\n      asOf\n      aum {\n        value\n        source\n        reason\n      }\n      gainLoss {\n        horizon\n        value\n        pct\n        reason\n      }\n    }\n  }\n"): typeof import('./graphql').DeploymentDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
