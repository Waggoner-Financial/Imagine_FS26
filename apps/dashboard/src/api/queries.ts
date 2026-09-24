import { graphql } from '../generated';

// Every query the dashboard sends. `moon run dashboard:codegen` reads these
// and generates their result and variable types into src/generated, so a
// query that asks for a field the schema does not have fails at codegen time.

export const portfoliosDocument = graphql(`
  query Portfolios {
    dashboardPortfolios {
      id
      code
      name
    }
  }
`);

export const summaryDocument = graphql(`
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
`);

export const deploymentDocument = graphql(`
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
`);
