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

export const sectorWeightsDocument = graphql(`
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
`);
export const expectedReturnDocument = graphql(`
  query ExpectedReturn($portfolioId: ID!) {
    portfolioExpectedReturn(portfolioId: $portfolioId) {
      portfolioEr
      coveredWeight
      topContributors {
        ticker
        targetWeight
        price
        priceTarget
        er
        contribution
      }
      bottomContributors {
        ticker
        targetWeight
        price
        priceTarget
        er
        contribution
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
  }
`);

export const fourPriceDocument = graphql(`
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
  }
`);

export const moversDocument = graphql(`
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
`);
