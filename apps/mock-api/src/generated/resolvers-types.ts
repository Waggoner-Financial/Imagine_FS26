import type { GraphQLResolveInfo } from 'graphql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Attribution = {
  __typename?: 'Attribution';
  bottomShare?: Maybe<Scalars['Float']['output']>;
  portfolioReturn: Scalars['Float']['output'];
  reason?: Maybe<Scalars['String']['output']>;
  /** Null when the portfolio return is too close to zero for a share to mean anything. */
  topShare?: Maybe<Scalars['Float']['output']>;
};

export type Aum = {
  __typename?: 'Aum';
  asOf: Scalars['String']['output'];
  reason?: Maybe<Scalars['String']['output']>;
  source: AumSource;
  /** Dollars. */
  value?: Maybe<Scalars['Float']['output']>;
};

/** Where an AUM figure came from. */
export type AumSource =
  | 'ACCOUNTING_SYSTEM'
  | 'MANUAL';

export type CorrelationPair = {
  __typename?: 'CorrelationPair';
  a: Scalars['String']['output'];
  b: Scalars['String']['output'];
  rho: Scalars['Float']['output'];
};

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

export type DashboardPortfolio = {
  __typename?: 'DashboardPortfolio';
  code: ModelPortfolioCode;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type DashboardSummary = {
  __typename?: 'DashboardSummary';
  asOf: Scalars['String']['output'];
  /** Holdings excluding cash. */
  holdingsCount: Scalars['Int']['output'];
  portfolio: DashboardPortfolio;
  /** Null when there is no trade date to measure from. */
  returnSinceTrade?: Maybe<ReturnSinceTrade>;
  /** Null when no trade date has been set for the portfolio. */
  tradeDate?: Maybe<Scalars['String']['output']>;
};

export type DeploymentPayload = {
  __typename?: 'DeploymentPayload';
  accountsCount: Scalars['Int']['output'];
  asOf: Scalars['String']['output'];
  aum: Aum;
  clientsCount: Scalars['Int']['output'];
  gainLoss: Array<GainLoss>;
};

export type ErContributor = {
  __typename?: 'ErContributor';
  contribution: Scalars['Float']['output'];
  /** Raw upside: (priceTarget - price) / price. */
  er: Scalars['Float']['output'];
  price: Scalars['Float']['output'];
  priceTarget: Scalars['Float']['output'];
  targetWeight: Scalars['Float']['output'];
  ticker: Scalars['String']['output'];
};

export type ExpectedReturnPayload = {
  __typename?: 'ExpectedReturnPayload';
  asOf: Scalars['String']['output'];
  bottomContributors: Array<ErContributor>;
  /** Weight the ER covers, excluding cash and holdings with no price target. */
  coveredWeight: Scalars['Float']['output'];
  /** Tickers carrying no price target. */
  noTarget: Array<Scalars['String']['output']>;
  portfolioEr: Scalars['Float']['output'];
  stalePriceTargets: StalePriceTargets;
  topContributors: Array<ErContributor>;
};

export type FourPricePayload = {
  __typename?: 'FourPricePayload';
  asOf: Scalars['String']['output'];
  /** Aggregated with target weights. */
  byTargetWeight: FourPriceSet;
  /**
   * Aggregated with target weight x expected return, renormalised. Holdings
   * priced at or above their target are excluded.
   */
  byWeightedEr: FourPriceSet;
  vsIndex: FourPriceRanking;
  vsSp500: FourPriceRanking;
};

export type FourPriceRanking = {
  __typename?: 'FourPriceRanking';
  constituents: Scalars['Int']['output'];
  div: RankStat;
  ern: RankStat;
  fcf: RankStat;
  rev: RankStat;
  universe: Scalars['String']['output'];
};

export type FourPriceSet = {
  __typename?: 'FourPriceSet';
  div: FourPriceValue;
  ern: FourPriceValue;
  fcf: FourPriceValue;
  rev: FourPriceValue;
};

export type FourPriceValue = {
  __typename?: 'FourPriceValue';
  /** Share of portfolio weight the multiple could be computed over. */
  coverageWeight: Scalars['Float']['output'];
  coveredHoldings: Scalars['Int']['output'];
  /**
   * Null only when coverage is below 25 % of weight. Between 25 % and 50 % the
   * multiple is present and the UI shows it greyed out.
   */
  multiple?: Maybe<Scalars['Float']['output']>;
  reason?: Maybe<Scalars['String']['output']>;
  totalHoldings: Scalars['Int']['output'];
};

export type GainLoss = {
  __typename?: 'GainLoss';
  horizon: DashboardHorizon;
  pct?: Maybe<Scalars['Float']['output']>;
  reason?: Maybe<Scalars['String']['output']>;
  /** Dollars. */
  value?: Maybe<Scalars['Float']['output']>;
};

export type HoldingSlice = {
  __typename?: 'HoldingSlice';
  isCash: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  /** Null for cash. */
  return?: Maybe<Scalars['Float']['output']>;
  sector: Scalars['String']['output'];
  ticker: Scalars['String']['output'];
  weight: Scalars['Float']['output'];
};

export type ModelPortfolioCode =
  | 'DIVIDEND'
  | 'EARNINGS'
  | 'EQUITY'
  | 'FCF'
  | 'REVENUE';

export type Mover = {
  __typename?: 'Mover';
  /** targetWeight x returnSinceTrade. These sum to the header return. */
  contribution: Scalars['Float']['output'];
  currentWeight: Scalars['Float']['output'];
  /** Drift in percentage points, not a fraction. */
  driftPp: Scalars['Float']['output'];
  name: Scalars['String']['output'];
  returnSinceTrade: Scalars['Float']['output'];
  targetWeight: Scalars['Float']['output'];
  ticker: Scalars['String']['output'];
};

export type MoversPayload = {
  __typename?: 'MoversPayload';
  asOf: Scalars['String']['output'];
  /** Null when there is no trade date to attribute against. */
  attribution?: Maybe<Attribution>;
  baselineDate?: Maybe<Scalars['String']['output']>;
  bottom: Array<Mover>;
  /** Set when the panel as a whole cannot be computed. */
  reason?: Maybe<Scalars['String']['output']>;
  top: Array<Mover>;
  tradeDate?: Maybe<Scalars['String']['output']>;
};

export type PriceSeries = {
  __typename?: 'PriceSeries';
  id: Scalars['ID']['output'];
  kind: SeriesKind;
  label: Scalars['String']['output'];
  /** At most 260 points; the server downsamples long windows. */
  points: Array<SeriesPoint>;
  /**
   * Set when points is empty. A series with no data at windowStart comes back
   * empty rather than rebased to its own later start date.
   */
  reason?: Maybe<Scalars['String']['output']>;
};

export type PriceSeriesPayload = {
  __typename?: 'PriceSeriesPayload';
  asOf: Scalars['String']['output'];
  horizon: DashboardHorizon;
  series: Array<PriceSeries>;
  /** Every series in the payload is rebased to 0 at this date. */
  windowStart: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  /** The model portfolios the dashboard selector offers. */
  dashboardPortfolios: Array<DashboardPortfolio>;
  /** Client money deployed in this model, and how it has performed. */
  deploymentSummary: DeploymentPayload;
  /** Header figures for one portfolio. */
  portfolioDashboardSummary: DashboardSummary;
  /** Return implied by price targets, plus stale and missing targets. */
  portfolioExpectedReturn: ExpectedReturnPayload;
  /** The four price multiples and where they rank against two universes. */
  portfolioFourPrice: FourPricePayload;
  /** Positions that moved most since the last trade, and what they explain. */
  portfolioMovers: MoversPayload;
  /** Cumulative return lines for the portfolio, its benchmark and its index. */
  portfolioPriceSeries: PriceSeriesPayload;
  /** VaR, expected shortfall, volatility and correlations. */
  portfolioRisk: RiskPayload;
  /** Where the weight sits by sector and by holding, with returns. */
  portfolioSectorWeights: SectorWeightsPayload;
};


export type QueryDeploymentSummaryArgs = {
  portfolioId: Scalars['ID']['input'];
};


export type QueryPortfolioDashboardSummaryArgs = {
  portfolioId: Scalars['ID']['input'];
};


export type QueryPortfolioExpectedReturnArgs = {
  count?: InputMaybe<Scalars['Int']['input']>;
  portfolioId: Scalars['ID']['input'];
};


export type QueryPortfolioFourPriceArgs = {
  portfolioId: Scalars['ID']['input'];
};


export type QueryPortfolioMoversArgs = {
  count?: InputMaybe<Scalars['Int']['input']>;
  portfolioId: Scalars['ID']['input'];
};


export type QueryPortfolioPriceSeriesArgs = {
  horizon: DashboardHorizon;
  portfolioId: Scalars['ID']['input'];
};


export type QueryPortfolioRiskArgs = {
  portfolioId: Scalars['ID']['input'];
};


export type QueryPortfolioSectorWeightsArgs = {
  horizon: DashboardHorizon;
  portfolioId: Scalars['ID']['input'];
};

export type RankStat = {
  __typename?: 'RankStat';
  percentile?: Maybe<Scalars['Float']['output']>;
  reason?: Maybe<Scalars['String']['output']>;
  universeMean?: Maybe<Scalars['Float']['output']>;
  universeStdDev?: Maybe<Scalars['Float']['output']>;
  zScore?: Maybe<Scalars['Float']['output']>;
};

export type ReturnSinceTrade = {
  __typename?: 'ReturnSinceTrade';
  baselineDate: Scalars['String']['output'];
  /** False while the figure ignores client cash flows; the UI discloses this. */
  flowAdjusted: Scalars['Boolean']['output'];
  latestDate: Scalars['String']['output'];
  returnPct: Scalars['Float']['output'];
};

export type RiskPayload = {
  __typename?: 'RiskPayload';
  asOf: Scalars['String']['output'];
  bottomCorrelations: Array<CorrelationPair>;
  es95: Scalars['Float']['output'];
  es95TenDay: Scalars['Float']['output'];
  es99: Scalars['Float']['output'];
  es99TenDay: Scalars['Float']['output'];
  /** Explains a null GARCH estimate, e.g. the model did not converge. */
  garchReason?: Maybe<Scalars['String']['output']>;
  garchVolAnnualized?: Maybe<Scalars['Float']['output']>;
  garchVolDaily?: Maybe<Scalars['Float']['output']>;
  requestedWindowDays: Scalars['Int']['output'];
  topCorrelations: Array<CorrelationPair>;
  /** One-day figures, as negative fractions. */
  var95: Scalars['Float']['output'];
  /** The one-day figures scaled by the square root of 10. */
  var95TenDay: Scalars['Float']['output'];
  var99: Scalars['Float']['output'];
  var99TenDay: Scalars['Float']['output'];
  weightedVolAnnualized?: Maybe<Scalars['Float']['output']>;
  weightedVolCoverage: Scalars['Float']['output'];
  /** Days of history actually used. */
  windowDays: Scalars['Int']['output'];
  /** Explains a window shorter than requested. */
  windowNote?: Maybe<Scalars['String']['output']>;
};

export type SectorSlice = {
  __typename?: 'SectorSlice';
  holdings: Array<Scalars['String']['output']>;
  isCash: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  /** Null for cash. */
  return?: Maybe<Scalars['Float']['output']>;
  vsBenchmark?: Maybe<Scalars['Float']['output']>;
  weight: Scalars['Float']['output'];
};

export type SectorWeightsPayload = {
  __typename?: 'SectorWeightsPayload';
  asOf: Scalars['String']['output'];
  /** S&P 500 return over the same horizon. */
  benchmarkReturn: Scalars['Float']['output'];
  holdings: Array<HoldingSlice>;
  horizon: DashboardHorizon;
  sectors: Array<SectorSlice>;
};

/** Which line of a Price Action chart a series represents. */
export type SeriesKind =
  | 'BENCHMARK'
  | 'INDEX'
  | 'PORTFOLIO';

export type SeriesPoint = {
  __typename?: 'SeriesPoint';
  /** A real sampled date, never interpolated. */
  date: Scalars['String']['output'];
  /** Cumulative return since windowStart. */
  value: Scalars['Float']['output'];
};

export type StalePriceTargets = {
  __typename?: 'StalePriceTargets';
  count: Scalars['Int']['output'];
  tickers: Array<StaleTarget>;
};

/** A price target set before the company's most recent earnings report. */
export type StaleTarget = {
  __typename?: 'StaleTarget';
  lastEarningsDate: Scalars['String']['output'];
  priceTargetDate: Scalars['String']['output'];
  ticker: Scalars['String']['output'];
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = Record<PropertyKey, never>, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;





/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Attribution: ResolverTypeWrapper<Attribution>;
  Aum: ResolverTypeWrapper<Aum>;
  AumSource: AumSource;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  CorrelationPair: ResolverTypeWrapper<CorrelationPair>;
  DashboardHorizon: DashboardHorizon;
  DashboardPortfolio: ResolverTypeWrapper<DashboardPortfolio>;
  DashboardSummary: ResolverTypeWrapper<DashboardSummary>;
  DeploymentPayload: ResolverTypeWrapper<DeploymentPayload>;
  ErContributor: ResolverTypeWrapper<ErContributor>;
  ExpectedReturnPayload: ResolverTypeWrapper<ExpectedReturnPayload>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  FourPricePayload: ResolverTypeWrapper<FourPricePayload>;
  FourPriceRanking: ResolverTypeWrapper<FourPriceRanking>;
  FourPriceSet: ResolverTypeWrapper<FourPriceSet>;
  FourPriceValue: ResolverTypeWrapper<FourPriceValue>;
  GainLoss: ResolverTypeWrapper<GainLoss>;
  HoldingSlice: ResolverTypeWrapper<HoldingSlice>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  ModelPortfolioCode: ModelPortfolioCode;
  Mover: ResolverTypeWrapper<Mover>;
  MoversPayload: ResolverTypeWrapper<MoversPayload>;
  PriceSeries: ResolverTypeWrapper<PriceSeries>;
  PriceSeriesPayload: ResolverTypeWrapper<PriceSeriesPayload>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  RankStat: ResolverTypeWrapper<RankStat>;
  ReturnSinceTrade: ResolverTypeWrapper<ReturnSinceTrade>;
  RiskPayload: ResolverTypeWrapper<RiskPayload>;
  SectorSlice: ResolverTypeWrapper<SectorSlice>;
  SectorWeightsPayload: ResolverTypeWrapper<SectorWeightsPayload>;
  SeriesKind: SeriesKind;
  SeriesPoint: ResolverTypeWrapper<SeriesPoint>;
  StalePriceTargets: ResolverTypeWrapper<StalePriceTargets>;
  StaleTarget: ResolverTypeWrapper<StaleTarget>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Attribution: Attribution;
  Aum: Aum;
  Boolean: Scalars['Boolean']['output'];
  CorrelationPair: CorrelationPair;
  DashboardPortfolio: DashboardPortfolio;
  DashboardSummary: DashboardSummary;
  DeploymentPayload: DeploymentPayload;
  ErContributor: ErContributor;
  ExpectedReturnPayload: ExpectedReturnPayload;
  Float: Scalars['Float']['output'];
  FourPricePayload: FourPricePayload;
  FourPriceRanking: FourPriceRanking;
  FourPriceSet: FourPriceSet;
  FourPriceValue: FourPriceValue;
  GainLoss: GainLoss;
  HoldingSlice: HoldingSlice;
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  Mover: Mover;
  MoversPayload: MoversPayload;
  PriceSeries: PriceSeries;
  PriceSeriesPayload: PriceSeriesPayload;
  Query: Record<PropertyKey, never>;
  RankStat: RankStat;
  ReturnSinceTrade: ReturnSinceTrade;
  RiskPayload: RiskPayload;
  SectorSlice: SectorSlice;
  SectorWeightsPayload: SectorWeightsPayload;
  SeriesPoint: SeriesPoint;
  StalePriceTargets: StalePriceTargets;
  StaleTarget: StaleTarget;
  String: Scalars['String']['output'];
};

export type AttributionResolvers<ContextType = any, ParentType extends ResolversParentTypes['Attribution'] = ResolversParentTypes['Attribution']> = {
  bottomShare?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  portfolioReturn?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  reason?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  topShare?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
};

export type AumResolvers<ContextType = any, ParentType extends ResolversParentTypes['Aum'] = ResolversParentTypes['Aum']> = {
  asOf?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  reason?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  source?: Resolver<ResolversTypes['AumSource'], ParentType, ContextType>;
  value?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
};

export type CorrelationPairResolvers<ContextType = any, ParentType extends ResolversParentTypes['CorrelationPair'] = ResolversParentTypes['CorrelationPair']> = {
  a?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  b?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  rho?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
};

export type DashboardPortfolioResolvers<ContextType = any, ParentType extends ResolversParentTypes['DashboardPortfolio'] = ResolversParentTypes['DashboardPortfolio']> = {
  code?: Resolver<ResolversTypes['ModelPortfolioCode'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type DashboardSummaryResolvers<ContextType = any, ParentType extends ResolversParentTypes['DashboardSummary'] = ResolversParentTypes['DashboardSummary']> = {
  asOf?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  holdingsCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  portfolio?: Resolver<ResolversTypes['DashboardPortfolio'], ParentType, ContextType>;
  returnSinceTrade?: Resolver<Maybe<ResolversTypes['ReturnSinceTrade']>, ParentType, ContextType>;
  tradeDate?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type DeploymentPayloadResolvers<ContextType = any, ParentType extends ResolversParentTypes['DeploymentPayload'] = ResolversParentTypes['DeploymentPayload']> = {
  accountsCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  asOf?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  aum?: Resolver<ResolversTypes['Aum'], ParentType, ContextType>;
  clientsCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  gainLoss?: Resolver<Array<ResolversTypes['GainLoss']>, ParentType, ContextType>;
};

export type ErContributorResolvers<ContextType = any, ParentType extends ResolversParentTypes['ErContributor'] = ResolversParentTypes['ErContributor']> = {
  contribution?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  er?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  price?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  priceTarget?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  targetWeight?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  ticker?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type ExpectedReturnPayloadResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExpectedReturnPayload'] = ResolversParentTypes['ExpectedReturnPayload']> = {
  asOf?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  bottomContributors?: Resolver<Array<ResolversTypes['ErContributor']>, ParentType, ContextType>;
  coveredWeight?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  noTarget?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  portfolioEr?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  stalePriceTargets?: Resolver<ResolversTypes['StalePriceTargets'], ParentType, ContextType>;
  topContributors?: Resolver<Array<ResolversTypes['ErContributor']>, ParentType, ContextType>;
};

export type FourPricePayloadResolvers<ContextType = any, ParentType extends ResolversParentTypes['FourPricePayload'] = ResolversParentTypes['FourPricePayload']> = {
  asOf?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  byTargetWeight?: Resolver<ResolversTypes['FourPriceSet'], ParentType, ContextType>;
  byWeightedEr?: Resolver<ResolversTypes['FourPriceSet'], ParentType, ContextType>;
  vsIndex?: Resolver<ResolversTypes['FourPriceRanking'], ParentType, ContextType>;
  vsSp500?: Resolver<ResolversTypes['FourPriceRanking'], ParentType, ContextType>;
};

export type FourPriceRankingResolvers<ContextType = any, ParentType extends ResolversParentTypes['FourPriceRanking'] = ResolversParentTypes['FourPriceRanking']> = {
  constituents?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  div?: Resolver<ResolversTypes['RankStat'], ParentType, ContextType>;
  ern?: Resolver<ResolversTypes['RankStat'], ParentType, ContextType>;
  fcf?: Resolver<ResolversTypes['RankStat'], ParentType, ContextType>;
  rev?: Resolver<ResolversTypes['RankStat'], ParentType, ContextType>;
  universe?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type FourPriceSetResolvers<ContextType = any, ParentType extends ResolversParentTypes['FourPriceSet'] = ResolversParentTypes['FourPriceSet']> = {
  div?: Resolver<ResolversTypes['FourPriceValue'], ParentType, ContextType>;
  ern?: Resolver<ResolversTypes['FourPriceValue'], ParentType, ContextType>;
  fcf?: Resolver<ResolversTypes['FourPriceValue'], ParentType, ContextType>;
  rev?: Resolver<ResolversTypes['FourPriceValue'], ParentType, ContextType>;
};

export type FourPriceValueResolvers<ContextType = any, ParentType extends ResolversParentTypes['FourPriceValue'] = ResolversParentTypes['FourPriceValue']> = {
  coverageWeight?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  coveredHoldings?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  multiple?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  reason?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  totalHoldings?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type GainLossResolvers<ContextType = any, ParentType extends ResolversParentTypes['GainLoss'] = ResolversParentTypes['GainLoss']> = {
  horizon?: Resolver<ResolversTypes['DashboardHorizon'], ParentType, ContextType>;
  pct?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  reason?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  value?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
};

export type HoldingSliceResolvers<ContextType = any, ParentType extends ResolversParentTypes['HoldingSlice'] = ResolversParentTypes['HoldingSlice']> = {
  isCash?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  return?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  sector?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  ticker?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  weight?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
};

export type MoverResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mover'] = ResolversParentTypes['Mover']> = {
  contribution?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  currentWeight?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  driftPp?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  returnSinceTrade?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  targetWeight?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  ticker?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type MoversPayloadResolvers<ContextType = any, ParentType extends ResolversParentTypes['MoversPayload'] = ResolversParentTypes['MoversPayload']> = {
  asOf?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  attribution?: Resolver<Maybe<ResolversTypes['Attribution']>, ParentType, ContextType>;
  baselineDate?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  bottom?: Resolver<Array<ResolversTypes['Mover']>, ParentType, ContextType>;
  reason?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  top?: Resolver<Array<ResolversTypes['Mover']>, ParentType, ContextType>;
  tradeDate?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type PriceSeriesResolvers<ContextType = any, ParentType extends ResolversParentTypes['PriceSeries'] = ResolversParentTypes['PriceSeries']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  kind?: Resolver<ResolversTypes['SeriesKind'], ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  points?: Resolver<Array<ResolversTypes['SeriesPoint']>, ParentType, ContextType>;
  reason?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type PriceSeriesPayloadResolvers<ContextType = any, ParentType extends ResolversParentTypes['PriceSeriesPayload'] = ResolversParentTypes['PriceSeriesPayload']> = {
  asOf?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  horizon?: Resolver<ResolversTypes['DashboardHorizon'], ParentType, ContextType>;
  series?: Resolver<Array<ResolversTypes['PriceSeries']>, ParentType, ContextType>;
  windowStart?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  dashboardPortfolios?: Resolver<Array<ResolversTypes['DashboardPortfolio']>, ParentType, ContextType>;
  deploymentSummary?: Resolver<ResolversTypes['DeploymentPayload'], ParentType, ContextType, RequireFields<QueryDeploymentSummaryArgs, 'portfolioId'>>;
  portfolioDashboardSummary?: Resolver<ResolversTypes['DashboardSummary'], ParentType, ContextType, RequireFields<QueryPortfolioDashboardSummaryArgs, 'portfolioId'>>;
  portfolioExpectedReturn?: Resolver<ResolversTypes['ExpectedReturnPayload'], ParentType, ContextType, RequireFields<QueryPortfolioExpectedReturnArgs, 'count' | 'portfolioId'>>;
  portfolioFourPrice?: Resolver<ResolversTypes['FourPricePayload'], ParentType, ContextType, RequireFields<QueryPortfolioFourPriceArgs, 'portfolioId'>>;
  portfolioMovers?: Resolver<ResolversTypes['MoversPayload'], ParentType, ContextType, RequireFields<QueryPortfolioMoversArgs, 'count' | 'portfolioId'>>;
  portfolioPriceSeries?: Resolver<ResolversTypes['PriceSeriesPayload'], ParentType, ContextType, RequireFields<QueryPortfolioPriceSeriesArgs, 'horizon' | 'portfolioId'>>;
  portfolioRisk?: Resolver<ResolversTypes['RiskPayload'], ParentType, ContextType, RequireFields<QueryPortfolioRiskArgs, 'portfolioId'>>;
  portfolioSectorWeights?: Resolver<ResolversTypes['SectorWeightsPayload'], ParentType, ContextType, RequireFields<QueryPortfolioSectorWeightsArgs, 'horizon' | 'portfolioId'>>;
};

export type RankStatResolvers<ContextType = any, ParentType extends ResolversParentTypes['RankStat'] = ResolversParentTypes['RankStat']> = {
  percentile?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  reason?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  universeMean?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  universeStdDev?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  zScore?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
};

export type ReturnSinceTradeResolvers<ContextType = any, ParentType extends ResolversParentTypes['ReturnSinceTrade'] = ResolversParentTypes['ReturnSinceTrade']> = {
  baselineDate?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  flowAdjusted?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  latestDate?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  returnPct?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
};

export type RiskPayloadResolvers<ContextType = any, ParentType extends ResolversParentTypes['RiskPayload'] = ResolversParentTypes['RiskPayload']> = {
  asOf?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  bottomCorrelations?: Resolver<Array<ResolversTypes['CorrelationPair']>, ParentType, ContextType>;
  es95?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  es95TenDay?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  es99?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  es99TenDay?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  garchReason?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  garchVolAnnualized?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  garchVolDaily?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  requestedWindowDays?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  topCorrelations?: Resolver<Array<ResolversTypes['CorrelationPair']>, ParentType, ContextType>;
  var95?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  var95TenDay?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  var99?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  var99TenDay?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  weightedVolAnnualized?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  weightedVolCoverage?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  windowDays?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  windowNote?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type SectorSliceResolvers<ContextType = any, ParentType extends ResolversParentTypes['SectorSlice'] = ResolversParentTypes['SectorSlice']> = {
  holdings?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  isCash?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  return?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  vsBenchmark?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  weight?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
};

export type SectorWeightsPayloadResolvers<ContextType = any, ParentType extends ResolversParentTypes['SectorWeightsPayload'] = ResolversParentTypes['SectorWeightsPayload']> = {
  asOf?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  benchmarkReturn?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  holdings?: Resolver<Array<ResolversTypes['HoldingSlice']>, ParentType, ContextType>;
  horizon?: Resolver<ResolversTypes['DashboardHorizon'], ParentType, ContextType>;
  sectors?: Resolver<Array<ResolversTypes['SectorSlice']>, ParentType, ContextType>;
};

export type SeriesPointResolvers<ContextType = any, ParentType extends ResolversParentTypes['SeriesPoint'] = ResolversParentTypes['SeriesPoint']> = {
  date?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
};

export type StalePriceTargetsResolvers<ContextType = any, ParentType extends ResolversParentTypes['StalePriceTargets'] = ResolversParentTypes['StalePriceTargets']> = {
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  tickers?: Resolver<Array<ResolversTypes['StaleTarget']>, ParentType, ContextType>;
};

export type StaleTargetResolvers<ContextType = any, ParentType extends ResolversParentTypes['StaleTarget'] = ResolversParentTypes['StaleTarget']> = {
  lastEarningsDate?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  priceTargetDate?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  ticker?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  Attribution?: AttributionResolvers<ContextType>;
  Aum?: AumResolvers<ContextType>;
  CorrelationPair?: CorrelationPairResolvers<ContextType>;
  DashboardPortfolio?: DashboardPortfolioResolvers<ContextType>;
  DashboardSummary?: DashboardSummaryResolvers<ContextType>;
  DeploymentPayload?: DeploymentPayloadResolvers<ContextType>;
  ErContributor?: ErContributorResolvers<ContextType>;
  ExpectedReturnPayload?: ExpectedReturnPayloadResolvers<ContextType>;
  FourPricePayload?: FourPricePayloadResolvers<ContextType>;
  FourPriceRanking?: FourPriceRankingResolvers<ContextType>;
  FourPriceSet?: FourPriceSetResolvers<ContextType>;
  FourPriceValue?: FourPriceValueResolvers<ContextType>;
  GainLoss?: GainLossResolvers<ContextType>;
  HoldingSlice?: HoldingSliceResolvers<ContextType>;
  Mover?: MoverResolvers<ContextType>;
  MoversPayload?: MoversPayloadResolvers<ContextType>;
  PriceSeries?: PriceSeriesResolvers<ContextType>;
  PriceSeriesPayload?: PriceSeriesPayloadResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  RankStat?: RankStatResolvers<ContextType>;
  ReturnSinceTrade?: ReturnSinceTradeResolvers<ContextType>;
  RiskPayload?: RiskPayloadResolvers<ContextType>;
  SectorSlice?: SectorSliceResolvers<ContextType>;
  SectorWeightsPayload?: SectorWeightsPayloadResolvers<ContextType>;
  SeriesPoint?: SeriesPointResolvers<ContextType>;
  StalePriceTargets?: StalePriceTargetsResolvers<ContextType>;
  StaleTarget?: StaleTargetResolvers<ContextType>;
};

