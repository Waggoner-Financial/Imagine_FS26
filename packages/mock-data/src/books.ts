// Every figure in this file is synthetic, invented to exercise the dashboard.
// The tickers are real public companies, but the weights, returns, price
// targets, AUM and account counts describe no real portfolio or firm.

import {
  type Book,
  type HoldingRow,
  SECTOR_CASH,
  toHolding,
} from './book.types';
import { AumSource, DashboardHorizon, ModelPortfolioCode } from './enums';

const COMMS = 'Communication Services';
const CONSUMER = 'Consumer Cyclical';
const ENERGY = 'Energy';
const FINANCIAL = 'Financial Services';
const HEALTH = 'Healthcare';
const INDUSTRIAL = 'Industrials';
const TECH = 'Technology';

const NOT_AVAILABLE_FOR_HORIZON = 'Not available for this horizon';

/**
 * EQUITY — the full twelve-name book from §5 of docs/spec.md. Every figure the
 * dashboard shows for this portfolio derives from this table; edit a weight
 * and test/derive.test.ts will say which figure stopped reconciling.
 *
 * ticker, name, sector, TW, price, PT, ret-since-trade, vol, pays-div, YTD, has-FCF
 */
const EQUITY_ROWS: HoldingRow[] = [
  ['NVDA', 'NVIDIA', TECH, 0.12, 118.4, 150, 0.041, 0.48, true, -0.06],
  ['MSFT', 'Microsoft', TECH, 0.1, 505.0, 560, 0.008, 0.22, true, 0.042],
  ['ABBV', 'AbbVie', HEALTH, 0.09, 212.55, 240, 0.012, 0.21, true, 0.06],
  ['AMZN', 'Amazon', CONSUMER, 0.09, 228.0, 270, 0.024, 0.3, false, 0.06],
  ['PLTR', 'Palantir', TECH, 0.08, 158.2, 175, -0.062, 0.62, false, -0.28],
  ['GOOGL', 'Alphabet', COMMS, 0.08, 212.0, 240, 0.03, 0.27, true, 0.11],
  [
    'SOFI',
    'SoFi Technologies',
    FINANCIAL,
    0.07,
    26.8,
    32,
    0.125,
    0.55,
    false,
    0.24,
  ],
  ['CAT', 'Caterpillar', INDUSTRIAL, 0.07, 415.0, 450, 0.019, 0.26, true, 0.09],
  [
    'DUOL',
    'Duolingo',
    TECH,
    0.06,
    342.1,
    420,
    0.093,
    0.5,
    false,
    -0.178,
    false,
  ],
  ['HOOD', 'Robinhood', FINANCIAL, 0.06, 112.3, 130, 0.119, 0.6, false, 0.175],
  ['UNH', 'UnitedHealth', HEALTH, 0.06, 305.0, 380, -0.048, 0.33, true, -0.19],
  ['XOM', 'Exxon Mobil', ENERGY, 0.06, 112.0, 125, -0.021, 0.24, true, -0.03],
  ['CASH', 'Cash', SECTOR_CASH, 0.06, null, null, 0, 0, false, null],
];

/** EARNINGS — no trade date. Exercises the header and Drift empty states. */
const EARNINGS_ROWS: HoldingRow[] = [
  ['MSFT', 'Microsoft', TECH, 0.16, 505.0, 560, 0.008, 0.22, true, 0.042],
  ['GOOGL', 'Alphabet', COMMS, 0.15, 212.0, 240, 0.03, 0.27, true, 0.11],
  ['META', 'Meta Platforms', COMMS, 0.15, 604.0, 700, 0.022, 0.34, true, 0.081],
  ['AVGO', 'Broadcom', TECH, 0.14, 292.0, 330, 0.017, 0.38, true, 0.145],
  ['ORCL', 'Oracle', TECH, 0.13, 178.0, 205, -0.011, 0.31, true, 0.062],
  [
    'JPM',
    'JPMorgan Chase',
    FINANCIAL,
    0.12,
    268.0,
    300,
    0.014,
    0.23,
    true,
    0.118,
  ],
  ['V', 'Visa', FINANCIAL, 0.1, 342.0, 385, 0.009, 0.19, true, 0.074],
  ['CASH', 'Cash', SECTOR_CASH, 0.05, null, null, 0, 0, false, null],
];

/**
 * DIVIDEND — two payers of seven (0.18 of weight) puts pDIV in the dash tier, and
 * thin FCF coverage (0.41) puts pFCF in the grey tier, so both 4P coverage
 * tiers render from one book.
 */
const DIVIDEND_ROWS: HoldingRow[] = [
  ['AMZN', 'Amazon', CONSUMER, 0.16, 228.0, 270, 0.024, 0.3, false, 0.06, true],
  [
    'TSLA',
    'Tesla',
    CONSUMER,
    0.15,
    412.0,
    450,
    -0.038,
    0.58,
    false,
    -0.115,
    true,
  ],
  [
    'NFLX',
    'Netflix',
    COMMS,
    0.14,
    1180.0,
    1320,
    0.031,
    0.36,
    false,
    0.164,
    false,
  ],
  [
    'CRM',
    'Salesforce',
    TECH,
    0.13,
    268.0,
    310,
    -0.019,
    0.33,
    false,
    -0.042,
    false,
  ],
  [
    'UBER',
    'Uber Technologies',
    INDUSTRIAL,
    0.12,
    88.0,
    105,
    0.046,
    0.41,
    false,
    0.132,
    false,
  ],
  ['ABBV', 'AbbVie', HEALTH, 0.1, 212.55, 240, 0.012, 0.21, true, 0.06, true],
  [
    'XOM',
    'Exxon Mobil',
    ENERGY,
    0.08,
    112.0,
    125,
    -0.021,
    0.24,
    true,
    -0.03,
    false,
  ],
  ['CASH', 'Cash', SECTOR_CASH, 0.12, null, null, 0, 0, false, null],
];

/**
 * FCF — returns very nearly cancel, so the weighted portfolio return lands at
 * 0.0004 and Drift renders "n/a (portfolio flat)" instead of a share.
 */
const FCF_ROWS: HoldingRow[] = [
  ['AAPL', 'Apple', TECH, 0.16, 242.0, 275, 0.02, 0.25, true, 0.093],
  [
    'BRK.B',
    'Berkshire Hathaway',
    FINANCIAL,
    0.15,
    486.0,
    520,
    -0.015,
    0.17,
    false,
    0.055,
  ],
  ['WMT', 'Walmart', CONSUMER, 0.15, 98.0, 110, -0.008, 0.2, true, 0.121],
  [
    'JNJ',
    'Johnson & Johnson',
    HEALTH,
    0.14,
    168.0,
    190,
    0.01,
    0.16,
    true,
    0.038,
  ],
  [
    'PG',
    'Procter & Gamble',
    CONSUMER,
    0.13,
    164.0,
    180,
    -0.012,
    0.15,
    true,
    0.021,
  ],
  ['KO', 'Coca-Cola', CONSUMER, 0.12, 71.0, 80, 0.008, 0.14, true, 0.047],
  ['PEP', 'PepsiCo', CONSUMER, 0.1, 152.0, 172, -0.0015, 0.16, true, -0.018],
  ['CASH', 'Cash', SECTOR_CASH, 0.05, null, null, 0, 0, false, null],
];

/**
 * REVENUE — SHOP and SNOW carry no price target (the Rebalancer's "no target"
 * list), GARCH does not converge, and CRWD trades above its target so its ER is
 * negative: the one holding that exercises the ER <= 0 exclusion in the WER
 * weighting (docs/spec.md, Definitions #2), which no other book covers.
 */
const REVENUE_ROWS: HoldingRow[] = [
  ['NVDA', 'NVIDIA', TECH, 0.16, 118.4, 150, 0.041, 0.48, false, -0.06],
  ['SHOP', 'Shopify', TECH, 0.14, 118.0, null, 0.052, 0.52, false, 0.187],
  ['SNOW', 'Snowflake', TECH, 0.13, 194.0, null, -0.027, 0.47, false, -0.064],
  ['NET', 'Cloudflare', TECH, 0.13, 142.0, 165, 0.038, 0.55, false, 0.142],
  ['DDOG', 'Datadog', TECH, 0.13, 136.0, 158, 0.021, 0.49, false, 0.078],
  ['CRWD', 'CrowdStrike', TECH, 0.13, 500.0, 460, -0.044, 0.51, false, -0.092],
  ['MDB', 'MongoDB', TECH, 0.13, 288.0, 330, 0.016, 0.57, false, 0.103],
  ['CASH', 'Cash', SECTOR_CASH, 0.05, null, null, 0, 0, false, null],
];

export const BOOKS: Book[] = [
  {
    asOf: '2026-09-01',
    code: ModelPortfolioCode.EQUITY,
    deployment: {
      accountsCount: 312,
      aum: 184_300_000,
      aumSource: AumSource.ACCOUNTING_SYSTEM,
      clientsCount: 187,
      gainLoss: [
        {
          horizon: DashboardHorizon.ONE_DAY,
          pct: null,
          reason: NOT_AVAILABLE_FOR_HORIZON,
          value: null,
        },
        { horizon: DashboardHorizon.ONE_MONTH, pct: 0.0118, value: 2_150_000 },
        { horizon: DashboardHorizon.YTD, pct: 0.1009, value: 16_900_000 },
        { horizon: DashboardHorizon.ONE_YEAR, pct: 0.1526, value: 24_400_000 },
      ],
    },
    fourPrice: {
      byTargetWeight: { div: 92.5, ern: 31.2, fcf: 28.4, rev: 6.8 },
      byWeightedEr: { div: 99.8, ern: 33.9, fcf: 30.1, rev: 7.4 },
      vsIndex: {
        constituents: 148,
        div: [0.7, 0.5, 71.0, 43.0],
        ern: [0.58, 0.2, 29.8, 7.0],
        fcf: [0.55, 0.1, 27.6, 8.1],
        rev: [0.61, 0.3, 5.9, 3.0],
        universe: 'Factor composite',
      },
      vsSp500: {
        constituents: 503,
        div: [0.88, 1.3, 52.0, 31.0],
        ern: [0.74, 0.7, 26.5, 6.7],
        fcf: [0.71, 0.6, 24.0, 7.3],
        rev: [0.82, 1.1, 3.9, 2.6],
        universe: 'S&P 500',
      },
    },
    holdings: EQUITY_ROWS.map(toHolding),
    id: 'p-equity',
    name: 'Sample Equity',
    risk: {
      bottomCorrelations: [
        ['XOM', 'DUOL', -0.08],
        ['ABBV', 'NVDA', 0.02],
        ['UNH', 'SOFI', 0.05],
      ],
      es95: -0.0198,
      es99: -0.0304,
      garchVolDaily: 0.0121,
      requestedWindowDays: 500,
      topCorrelations: [
        ['SOFI', 'HOOD', 0.65],
        ['NVDA', 'PLTR', 0.58],
        ['MSFT', 'GOOGL', 0.55],
      ],
      var95: -0.0142,
      var99: -0.0231,
      windowDays: 320,
      windowNote:
        'Window shortened to 320 days because DUOL has 320 days of history.',
    },
    series: {
      benchmarkSinceTrade: 0.0134,
      endpoints: [
        { benchmark: 0.358, horizon: DashboardHorizon.ALL, portfolio: 0.412 },
        {
          benchmark: 0.0014,
          horizon: DashboardHorizon.ONE_DAY,
          portfolio: 0.0021,
        },
        {
          benchmark: 0.0142,
          horizon: DashboardHorizon.ONE_MONTH,
          portfolio: 0.0187,
        },
        {
          benchmark: 0.1105,
          horizon: DashboardHorizon.ONE_YEAR,
          portfolio: 0.1342,
        },
      ],
      inception: '2021-03-01',
      indexReason: 'Index series not available before 2026-08-20',
    },
    staleTargets: [
      {
        lastEarningsDate: '2026-07-29',
        priceTargetDate: '2026-07-02',
        ticker: 'UNH',
      },
      {
        lastEarningsDate: '2026-08-05',
        priceTargetDate: '2026-07-15',
        ticker: 'CAT',
      },
    ],
    tradeDate: '2026-08-12',
    ytdBenchmarkReturn: 0.08,
  },
  {
    asOf: '2026-09-01',
    code: ModelPortfolioCode.EARNINGS,
    deployment: {
      accountsCount: 96,
      aum: 48_700_000,
      aumSource: AumSource.ACCOUNTING_SYSTEM,
      clientsCount: 61,
      gainLoss: [
        {
          horizon: DashboardHorizon.ONE_DAY,
          pct: null,
          reason: NOT_AVAILABLE_FOR_HORIZON,
          value: null,
        },
        { horizon: DashboardHorizon.ONE_MONTH, pct: 0.0094, value: 452_000 },
        { horizon: DashboardHorizon.YTD, pct: 0.0871, value: 3_900_000 },
        { horizon: DashboardHorizon.ONE_YEAR, pct: 0.1342, value: 5_760_000 },
      ],
    },
    fourPrice: {
      byTargetWeight: { div: 64.2, ern: 27.8, fcf: 24.1, rev: 5.9 },
      byWeightedEr: { div: 68.4, ern: 29.6, fcf: 25.7, rev: 6.3 },
      vsIndex: {
        constituents: 148,
        div: [0.52, 0.1, 71.0, 43.0],
        ern: [0.5, 0.0, 29.8, 7.0],
        fcf: [0.47, -0.1, 27.6, 8.1],
        rev: [0.54, 0.1, 5.9, 3.0],
        universe: 'Factor composite',
      },
      vsSp500: {
        constituents: 503,
        div: [0.71, 0.4, 52.0, 31.0],
        ern: [0.66, 0.2, 26.5, 6.7],
        fcf: [0.6, 0.0, 24.0, 7.3],
        rev: [0.74, 0.8, 3.9, 2.6],
        universe: 'S&P 500',
      },
    },
    holdings: EARNINGS_ROWS.map(toHolding),
    id: 'p-earnings',
    name: 'Sample Earnings',
    risk: {
      bottomCorrelations: [
        ['JPM', 'ORCL', 0.11],
        ['V', 'AVGO', 0.18],
        ['META', 'JPM', 0.22],
      ],
      es95: -0.0171,
      es99: -0.0262,
      garchVolDaily: 0.0104,
      requestedWindowDays: 500,
      topCorrelations: [
        ['MSFT', 'GOOGL', 0.62],
        ['AVGO', 'ORCL', 0.57],
        ['META', 'GOOGL', 0.54],
      ],
      var95: -0.0124,
      var99: -0.0198,
      windowDays: 500,
    },
    series: {
      benchmarkSinceTrade: 0.0134,
      endpoints: [
        { benchmark: 0.241, horizon: DashboardHorizon.ALL, portfolio: 0.286 },
        {
          benchmark: 0.0014,
          horizon: DashboardHorizon.ONE_DAY,
          portfolio: 0.0016,
        },
        {
          benchmark: 0.0142,
          horizon: DashboardHorizon.ONE_MONTH,
          portfolio: 0.0138,
        },
        {
          benchmark: 0.1105,
          horizon: DashboardHorizon.ONE_YEAR,
          portfolio: 0.1204,
        },
      ],
      inception: '2022-06-01',
      indexReason: 'Index series not available before 2026-08-20',
    },
    staleTargets: [],
    tradeDate: null,
    ytdBenchmarkReturn: 0.08,
  },
  {
    asOf: '2026-09-01',
    code: ModelPortfolioCode.DIVIDEND,
    deployment: {
      accountsCount: 74,
      aum: 31_200_000,
      aumSource: AumSource.ACCOUNTING_SYSTEM,
      clientsCount: 48,
      gainLoss: [
        {
          horizon: DashboardHorizon.ONE_DAY,
          pct: null,
          reason: NOT_AVAILABLE_FOR_HORIZON,
          value: null,
        },
        { horizon: DashboardHorizon.ONE_MONTH, pct: 0.0061, value: 189_000 },
        { horizon: DashboardHorizon.YTD, pct: 0.0412, value: 1_230_000 },
        { horizon: DashboardHorizon.ONE_YEAR, pct: 0.0688, value: 2_010_000 },
      ],
    },
    fourPrice: {
      byTargetWeight: { div: 118.4, ern: 34.6, fcf: 31.9, rev: 7.2 },
      byWeightedEr: { div: 124.1, ern: 36.2, fcf: 33.4, rev: 7.6 },
      vsIndex: {
        constituents: 148,
        div: [0.81, 0.9, 71.0, 43.0],
        ern: [0.68, 0.4, 29.8, 7.0],
        fcf: [0.64, 0.3, 27.6, 8.1],
        rev: [0.7, 0.5, 5.9, 3.0],
        universe: 'Factor composite',
      },
      vsSp500: {
        constituents: 503,
        div: [0.92, 1.6, 52.0, 31.0],
        ern: [0.8, 0.9, 26.5, 6.7],
        fcf: [0.79, 0.8, 24.0, 7.3],
        rev: [0.85, 1.2, 3.9, 2.6],
        universe: 'S&P 500',
      },
    },
    holdings: DIVIDEND_ROWS.map(toHolding),
    id: 'p-dividend',
    name: 'Sample Dividend',
    risk: {
      bottomCorrelations: [
        ['XOM', 'NFLX', -0.04],
        ['ABBV', 'TSLA', 0.06],
        ['XOM', 'CRM', 0.09],
      ],
      es95: -0.0224,
      es99: -0.0341,
      garchVolDaily: 0.0138,
      requestedWindowDays: 500,
      topCorrelations: [
        ['CRM', 'UBER', 0.59],
        ['AMZN', 'NFLX', 0.53],
        ['TSLA', 'AMZN', 0.49],
      ],
      var95: -0.0163,
      var99: -0.0259,
      windowDays: 500,
    },
    series: {
      benchmarkSinceTrade: 0.0134,
      endpoints: [
        { benchmark: 0.212, horizon: DashboardHorizon.ALL, portfolio: 0.194 },
        {
          benchmark: 0.0014,
          horizon: DashboardHorizon.ONE_DAY,
          portfolio: -0.0008,
        },
        {
          benchmark: 0.0142,
          horizon: DashboardHorizon.ONE_MONTH,
          portfolio: 0.0061,
        },
        {
          benchmark: 0.1105,
          horizon: DashboardHorizon.ONE_YEAR,
          portfolio: 0.0688,
        },
      ],
      inception: '2023-01-04',
      indexReason: 'Index series not available before 2026-08-20',
    },
    staleTargets: [
      {
        lastEarningsDate: '2026-08-12',
        priceTargetDate: '2026-06-18',
        ticker: 'CRM',
      },
    ],
    tradeDate: '2026-08-12',
    ytdBenchmarkReturn: 0.08,
  },
  {
    asOf: '2026-09-01',
    code: ModelPortfolioCode.FCF,
    deployment: {
      accountsCount: 58,
      aum: 22_900_000,
      aumSource: AumSource.ACCOUNTING_SYSTEM,
      clientsCount: 39,
      gainLoss: [
        {
          horizon: DashboardHorizon.ONE_DAY,
          pct: null,
          reason: NOT_AVAILABLE_FOR_HORIZON,
          value: null,
        },
        { horizon: DashboardHorizon.ONE_MONTH, pct: 0.0027, value: 61_000 },
        { horizon: DashboardHorizon.YTD, pct: 0.0538, value: 1_170_000 },
        { horizon: DashboardHorizon.ONE_YEAR, pct: 0.0794, value: 1_680_000 },
      ],
    },
    fourPrice: {
      byTargetWeight: { div: 71.8, ern: 22.4, fcf: 19.6, rev: 3.1 },
      byWeightedEr: { div: 74.3, ern: 23.1, fcf: 20.2, rev: 3.2 },
      vsIndex: {
        constituents: 148,
        div: [0.58, 0.2, 71.0, 43.0],
        ern: [0.31, -0.5, 29.8, 7.0],
        fcf: [0.28, -0.6, 27.6, 8.1],
        rev: [0.24, -0.7, 5.9, 3.0],
        universe: 'Factor composite',
      },
      vsSp500: {
        constituents: 503,
        div: [0.66, 0.3, 52.0, 31.0],
        ern: [0.38, -0.3, 26.5, 6.7],
        fcf: [0.35, -0.4, 24.0, 7.3],
        rev: [0.29, -0.6, 3.9, 2.6],
        universe: 'S&P 500',
      },
    },
    holdings: FCF_ROWS.map(toHolding),
    id: 'p-fcf',
    name: 'Sample Free Cash Flow',
    risk: {
      bottomCorrelations: [
        ['KO', 'AAPL', 0.12],
        ['PG', 'BRK.B', 0.16],
        ['JNJ', 'AAPL', 0.19],
      ],
      es95: -0.0119,
      es99: -0.0183,
      garchVolDaily: 0.0072,
      requestedWindowDays: 500,
      topCorrelations: [
        ['KO', 'PEP', 0.78],
        ['PG', 'JNJ', 0.61],
        ['PG', 'KO', 0.58],
      ],
      var95: -0.0087,
      var99: -0.0141,
      windowDays: 500,
    },
    series: {
      benchmarkSinceTrade: 0.0134,
      endpoints: [
        { benchmark: 0.268, horizon: DashboardHorizon.ALL, portfolio: 0.231 },
        {
          benchmark: 0.0014,
          horizon: DashboardHorizon.ONE_DAY,
          portfolio: 0.0009,
        },
        {
          benchmark: 0.0142,
          horizon: DashboardHorizon.ONE_MONTH,
          portfolio: 0.0044,
        },
        {
          benchmark: 0.1105,
          horizon: DashboardHorizon.ONE_YEAR,
          portfolio: 0.0794,
        },
      ],
      inception: '2022-09-06',
      indexReason: 'Index series not available before 2026-08-20',
    },
    staleTargets: [],
    tradeDate: '2026-08-12',
    ytdBenchmarkReturn: 0.08,
  },
  {
    asOf: '2026-09-01',
    code: ModelPortfolioCode.REVENUE,
    deployment: {
      accountsCount: 41,
      aum: 14_600_000,
      aumSource: AumSource.ACCOUNTING_SYSTEM,
      clientsCount: 27,
      gainLoss: [
        {
          horizon: DashboardHorizon.ONE_DAY,
          pct: null,
          reason: NOT_AVAILABLE_FOR_HORIZON,
          value: null,
        },
        { horizon: DashboardHorizon.ONE_MONTH, pct: 0.0143, value: 206_000 },
        { horizon: DashboardHorizon.YTD, pct: 0.0721, value: 982_000 },
        { horizon: DashboardHorizon.ONE_YEAR, pct: 0.1874, value: 2_300_000 },
      ],
    },
    fourPrice: {
      byTargetWeight: { div: 0, ern: 68.4, fcf: 52.1, rev: 14.2 },
      byWeightedEr: { div: 0, ern: 71.9, fcf: 54.8, rev: 15.1 },
      vsIndex: {
        constituents: 148,
        div: [0.0, -1.4, 71.0, 43.0],
        ern: [0.94, 1.8, 29.8, 7.0],
        fcf: [0.91, 1.6, 27.6, 8.1],
        rev: [0.96, 2.1, 5.9, 3.0],
        universe: 'Factor composite',
      },
      vsSp500: {
        constituents: 503,
        div: [0.0, -1.7, 52.0, 31.0],
        ern: [0.97, 2.4, 26.5, 6.7],
        fcf: [0.95, 2.2, 24.0, 7.3],
        rev: [0.98, 2.9, 3.9, 2.6],
        universe: 'S&P 500',
      },
    },
    holdings: REVENUE_ROWS.map(toHolding),
    id: 'p-revenue',
    name: 'Sample Revenue',
    risk: {
      bottomCorrelations: [
        ['CRWD', 'SHOP', 0.21],
        ['MDB', 'NVDA', 0.28],
        ['SNOW', 'NVDA', 0.31],
      ],
      es95: -0.0312,
      es99: -0.0468,
      garchReason:
        'GARCH(1,1) did not converge on the available return history.',
      garchVolDaily: null,
      requestedWindowDays: 500,
      topCorrelations: [
        ['DDOG', 'MDB', 0.71],
        ['NET', 'DDOG', 0.66],
        ['SNOW', 'MDB', 0.63],
      ],
      var95: -0.0228,
      var99: -0.0357,
      windowDays: 412,
      windowNote:
        'Window shortened to 412 days because NET has 412 days of history.',
    },
    series: {
      benchmarkSinceTrade: 0.0134,
      endpoints: [
        { benchmark: 0.189, horizon: DashboardHorizon.ALL, portfolio: 0.467 },
        {
          benchmark: 0.0014,
          horizon: DashboardHorizon.ONE_DAY,
          portfolio: 0.0034,
        },
        {
          benchmark: 0.0142,
          horizon: DashboardHorizon.ONE_MONTH,
          portfolio: 0.0212,
        },
        {
          benchmark: 0.1105,
          horizon: DashboardHorizon.ONE_YEAR,
          portfolio: 0.1874,
        },
      ],
      inception: '2024-02-01',
      indexReason: 'Index series not available before 2026-08-20',
    },
    staleTargets: [
      {
        lastEarningsDate: '2026-08-27',
        priceTargetDate: '2026-05-22',
        ticker: 'DDOG',
      },
    ],
    tradeDate: '2026-08-12',
    ytdBenchmarkReturn: 0.08,
  },
];

export const BOOKS_BY_ID: ReadonlyMap<string, Book> = new Map(
  BOOKS.map((book) => [book.id, book])
);
