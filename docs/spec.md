# Portfolio Dashboard — Spec

You are building one read-only dashboard page for a model portfolio, against a
mock GraphQL API that serves synthetic data. This document describes the page
(§1–3), the API contract (§4) and the sample data behind it (§5).

- **The API** lives in `apps/mock-api`. Run it with `moon run mock-api:dev` and
  open <http://localhost:4000/graphql>, where GraphiQL documents every field.
  `apps/mock-api/schema.graphql` is the authoritative contract: where this
  document and the schema disagree, the schema wins.
- **The data is synthetic.** The tickers are real public companies, but the
  weights, returns, price targets and account figures describe no real portfolio
  or firm.
- **Behaviour, not pixels.** §1–3 describe what each panel shows and how it
  behaves. The visual design is yours.

---

## 1. Overview

One screen that answers, for a model portfolio, seven questions at a glance:

| Panel             | Question it answers                                                                   |
| ----------------- | ------------------------------------------------------------------------------------- |
| Price Action      | How has the portfolio moved versus the S&P 500 and its factor index over the horizon? |
| Portfolio 4P      | How is the portfolio valued (four price multiples) and where does that rank?          |
| VOLcano           | How risky is it right now (VaR, expected shortfall, volatility, correlations)?        |
| Drift             | Which positions moved most since we last traded, and how much do they explain?        |
| Rebalancer        | What return do our price targets imply, and which targets are stale?                  |
| Deployment        | How much client money sits in this model, and how has it done?                        |
| Sector / Holdings | Where is the weight, and what has each sector or holding returned?                    |

Users are a portfolio team. The page is a summary layer: each panel answers its
question at a glance, and in a full product would link to a deeper page on its
topic — a placeholder link is fine here.

Design principles:

- **Glanceable.** Numbers first, charts second, no scrolling tables inside
  cards.
- **Dated.** Every figure carries an as-of date. Different panels may have
  different as-of dates.
- **Honest.** Disclosures are shown, not hidden — "not flow-adjusted", "based on
  320 of 500 days", "7 of 12 holdings pay dividends". A missing figure shows a
  dash and a reason, never a zero.
- **Parametrized.** One page for all model portfolios: EQUITY (default),
  EARNINGS, DIVIDEND, FCF, REVENUE.

## 2. Page anatomy

- **Portfolio selector** in the header changes every panel. Persist the last
  choice per browser.
- **Global horizon toggle** (1D / 1M / 1Y / YTD / All / Trade) drives Price
  Action and the treemap, and nothing else. "Trade" means "since the close of
  the trade date". Panels with a fixed window (VOLcano, Rebalancer) say which
  window they use in their caption.
- **Panel-local controls** do _not_ follow the global horizon: 4P's "vs S&P 500
  / vs Index" tabs, Deployment's gain/loss horizon, and the treemap's Sector /
  Holdings switch are each local to their card. Only the portfolio selector and
  the global horizon cross panels.
- **Cards** share one chrome: a title, a link icon top-right, the body, and an
  as-of caption at the bottom. The Rebalancer card shows a warning badge when
  stale price targets exist.
- **Responsive:** three columns at ≥ 1100 px, two on tablet, one on mobile; the
  treemap keeps a minimum height of 320 px and never scrolls horizontally.

## 3. Panel specs

Each panel follows the same template: purpose · what it shows · definitions ·
interactions · states · contract.

### 3.1 Header

- **Shows:** portfolio code and name, holdings count, and "return since last
  trade \[trade date\]".
- **Definitions:**
  - _Holdings_ = number of non-cash positions currently in the model
  - _Trade date_ = the day the portfolio was last traded back to its target
    weights, set manually by the portfolio team. A one-off position swap does
    **not** move it — only a full rebalance back to target weights does. This
    matters because every since-trade figure on the page (the header pill, all
    of §3.5, the treemap's Trade horizon) is measured from it.
  - _Return since last trade_ = total-return of the portfolio from the **close
    of the trade date** to the latest close. A trade date is always a trading
    day by construction, so a trade date with no close means bad data rather
    than a normal case. When it happens the baseline snaps **forward** to the
    next close, the caption names the date used, and the discrepancy is logged —
    note that forward-snapping excludes the first trading day's move from the
    headline figure. See Definitions #11.
- **Interactions:** the return pill opens a tooltip: baseline date, latest date,
  and the disclosure below.
- **States:** no trade date → "Trade date not set" and the pill shows a dash.
  Disclosure (always): _"Raw change in portfolio value; contributions and
  withdrawals read as performance."_
- **Contract:** `portfolioDashboardSummary`.

### 3.2 Price Action

- **Shows:** cumulative return lines over the selected horizon for the
  portfolio, the S&P 500, and the portfolio's factor index, with three
  checkboxes (portfolio / S&P / index) toggling the lines.
- **Definitions:**
  - Lines are **cumulative total return rebased to 0% at the window start**.
  - _S&P 500_ is a total-return series (the SPY ETF stands in; label it "S&P 500
    (SPY)").
  - _Factor index_ is the equal-weighted return of the constituents of the
    model's screening index (revenue, free cash flow, earnings or dividend). For
    EQUITY it is the equal-weighted composite of the four (see Definitions #1).
  - Horizon windows: 1D = last close vs prior close; 1M / 1Y = calendar month /
    year back; YTD = prior year-end; Trade = since most recent trade-date close.
  - **All** = the model's full history. `windowStart` is the earliest date the
    **portfolio** series has a value — model inception — and is _not_ the
    earliest date the benchmark or index happens to have. Every series is
    rebased to 0 % at that same `windowStart`; a series with no data on that
    date is returned as `points: []` with a `reason` rather than rebased to a
    later start of its own, because the shared zero is the only thing that makes
    the lines comparable. (This is the same empty-state mechanism the index
    series already uses.)
  - Because All can span years, the **server** downsamples every series to the ≤
    260 points per line that §6 allows, stepping daily → weekly → monthly as the
    span requires. The client never thins a series itself. `SeriesPoint.date`
    always carries the real sampled date, so a crosshair reads a genuine close
    rather than an interpolated one. The last point is always the latest close,
    never dropped by the sampling step.
- **Interactions:** hover crosshair shows date and every visible line's value.
- **States:** a series with no data for the window is drawn as nothing and its
  checkbox shows a dash with a reason. Skeleton chart while loading.
- **Contract:** `portfolioPriceSeries`.

### 3.3 Portfolio 4P

- **Shows:** four valuation multiples for the whole portfolio, two ways
  (weighted by target weight and by expected-return weight), and where each
  multiple sits versus the S&P 500 and versus the factor index (percentile and
  z-score).
- **Definitions:**
  - The four "prices", each **market cap ÷ trailing-twelve-month metric**: pREV
    (revenue), pFCF (unlevered free cash flow), pERN (net income), pDIV
    (dividends paid).
  - _TW_ = the holding's target weight. _WER_ = expected-return weight: each
    holding's `TW × ER`, renormalized to sum to 1 (ER as defined in 3.6).
    Holdings with **ER ≤ 0** (priced at or above their target) are **excluded**
    from the WER weighting and the remaining weights renormalized — otherwise
    `TW × ER` goes negative and the weighted harmonic mean below is undefined.
    Because of this, WER coverage is reported separately from TW coverage and is
    often the lower of the two. See Definitions #2.
  - Portfolio multiple = **weighted harmonic mean** of holding multiples (Σw ÷
    Σ(w ÷ multiple)). Holdings with no meaningful multiple (negative or zero
    denominator) are excluded and the weights renormalized; show coverage ("7 of
    12 pay dividends").
  - _Percentile_ = share of constituents in the comparison universe whose
    multiple is below the portfolio's. _z-score_ = (portfolio − universe mean) ÷
    universe standard deviation. Two universes: S&P 500 constituents and the
    model's factor index constituents.
- **Interactions:** tab between "vs S&P 500" and "vs Index". Hover a metric for
  coverage and the universe's mean and σ.
- **States:** coverage is reported in two tiers, so the panel distinguishes
  "thin" from "unusable".
  - Coverage **below 50 % of weight** → the multiple still renders, greyed, with
    a "low coverage" label; the exact coverage sits in its tooltip. `multiple`
    is non-null.
  - Coverage **below 25 % of weight** → `multiple` is `null` with a `reason`,
    and the cell shows a dash. We won't stand behind a number this thin.
  - The two are deliberately distinct: grey means "usable, with a caveat", a
    dash means "no figure". Do not collapse them. See Definitions #12.
- **Contract:** `portfolioFourPrice`.

### 3.4 VOLcano

- **Shows:** VaR and expected shortfall at 95 % and 99 %, each rendered
  **one-day and ten-day as adjacent columns** (not behind a tooltip — they are
  first-class fields in §4, and hover-only figures fail §6's accessibility rule
  on touch and keyboard); GARCH forecast volatility; weighted-average holding
  volatility; and the three most and three least correlated pairs of holdings.
- **Definitions:**
  - _VaR / ES_ are one-day loss quantiles of the portfolio's daily return
    history (500 trading days; negative fractions, so −0.0142 reads "−1.42 %").
    Ten-day = one-day × √10.
  - **Portfolio VaR/ES are not breach-coloured.** There is no portfolio-level
    threshold in `RiskPayload`, and a per-stock threshold does not generalise to
    a portfolio. Render all eight figures in neutral ink and let the minus glyph
    carry the sign. If a house risk limit is set later, it arrives as a new
    field, not as a hardcoded number in the UI. See Definitions #13.
  - _GARCH volatility_ = next-day volatility forecast from a GARCH(1,1) fit;
    show daily and annualized (× √252).
  - _Weighted volatility_ = Σ wᵢ σᵢ over holdings, σᵢ the holding's annualized
    GARCH volatility, wᵢ the target weight.
  - _Correlations_ are pairwise over the common history window; pairs are ranked
    by ρ and shown as "SOFI | HOOD 0.65".
- **Interactions:** none beyond the card's link.
- **States:** if any holding has fewer days of history than the window, the
  caption reads "Window shortened to N days because TICKER has N days of
  history." If GARCH is unavailable → " — model did not converge".
- **Contract:** `portfolioRisk`.

### 3.5 Drift

- **Shows:** top three and bottom three most moved positions (movers) since the
  trade date, each with weight and drift, and the share of the portfolio's
  since-trade return that the top three and bottom three explain.
- **Definitions:**
  - _Mover return_ = holding price return from the trade-date close to the
    latest close.
  - _Drift_ = current weight − target weight, in percentage points.
  - _Contribution_ = target weight × mover return. _Attribution share_ = Σ
    contribution of the group ÷ Σ contribution of all holdings. Shares may
    exceed 100 % or be negative when the total is small. When
    `|portfolioReturn| < 0.001` — that is, within ±0.1 percentage points of flat
    — set both `topShare` and `bottomShare` to `null` with
    `reason: "n/a (portfolio flat)"`, and render that string in place of both
    shares. (Thresholds are fractions like every other figure in §4; ±0.1 % here
    means 0.001, not 0.1 of the return.)
- **Interactions:** a ticker can link to a per-stock detail page (a placeholder
  is fine).
- **States:** no trade date → panel body says "Set a trade date on Drift to see
  movers."
- **Contract:** `portfolioMovers`.

### 3.6 Rebalancer

- **Shows:** portfolio expected return, the top three and bottom three
  contributors, and how many price targets are stale.
- **Definitions:**
  - _ER of a holding_ = (price target − price) ÷ price, using the holding's
    current price target and the latest close (raw upside, not annualized).
  - _Portfolio ER_ = Σ TWᵢ × ERᵢ. _Contribution_ = TWᵢ × ERᵢ. Cash
    contributes 0.
  - _Stale price target_ = the holding has reported earnings since its price
    target was last set.
- **Interactions:** the warning badge and the stale count open the list of stale
  tickers. There is **no** rebalance action in v1.
- **States:** holdings without a price target are excluded from ER and listed
  under "no target".
- **Contract:** `portfolioExpectedReturn`.

### 3.7 Deployment

- **Shows:** number of client accounts and distinct clients invested in the
  model, assets under management in the model, and aggregate gain/loss with a
  **1D / 1M / YTD / 1Y** toggle. The 1D segment is present deliberately even
  though it never has a value — it is this panel's designated empty state (see
  §4). This toggle is local to the card and does not follow the global horizon.
- **Definitions:**
  - _Accounts_ = client accounts assigned to the model; _clients_ = distinct
    account owners.
  - _AUM_ = sum of those accounts' current market value; the payload names the
    `source` so the UI can label a manual figure differently from a live one.
  - _Aggregate gain/loss_ = change in total value over the horizon, in dollars
    and percent.
- **Interactions:** the card-local gain/loss horizon toggle.
- **States:** 1D gain/loss is **always** unavailable in v1 — the data source has
  no one-day figure — so it renders as a dash with its `reason` every time.
  Other horizons may also come back `null` and behave identically. Never
  substitute a zero.
- **Contract:** `deploymentSummary`.

### 3.8 Sector / Holdings treemap

- **Shows:** a treemap toggled between sectors and holdings; tile area = weight,
  tile color = return over the global horizon (diverging scale, neutral at 0),
  label = name and return.
- **Definitions:** sector weight = Σ holding weights in the sector; sector
  return = weight-averaged holding returns; `vsBenchmark` = sector return − S&P
  500 return over the same horizon. Note `HoldingSlice` carries no
  `vsBenchmark`, so the holdings-level hover omits that row rather than
  computing it client-side. Tile weights **include** the cash tile while returns
  exclude it, so the caption must say so — otherwise a reader weight-averaging
  the displayed sector returns over the displayed weights gets 2.67 % against
  the header's 2.51 %.
- **Interactions:** hover → weight, return, vs benchmark, holdings in the
  sector; click a sector to zoom to its holdings; click a holding for its
  detail.
- **States:** cash is its own neutral tile, never colored by return.
- **Contract:** `portfolioSectorWeights`.

## 4. API contract

The full contract is `apps/mock-api/schema.graphql`; GraphiQL on the running
server documents every type and field. Conventions shared by every query:

- Every portfolio-scoped query takes `portfolioId: ID!`; `dashboardPortfolios`
  lists the ids to pass (`p-equity`, `p-earnings`, `p-dividend`, `p-fcf`,
  `p-revenue`).
- Dates are `String` in `YYYY-MM-DD`. Every payload carries `asOf`.
- Returns, weights, percentiles, volatilities and VaR/ES are **fractions**
  (0.0251 = 2.51 %). Money is `Float` in dollars. Multiples are plain numbers
  (12.3 = 12.3×). Values are full-precision floats; round them for display.
- A figure that cannot be computed is `null` with a sibling `reason: String`.
  Every panel has at least one such case in the sample data (§5), so every empty
  state can be built and seen.
- An unknown `portfolioId` returns a GraphQL error with `extensions.code` set to
  `NOT_FOUND`.

```graphql
enum DashboardHorizon {
  ONE_DAY
  ONE_MONTH
  ONE_YEAR
  YTD
  ALL
  SINCE_TRADE
}
enum ModelPortfolioCode {
  EQUITY
  EARNINGS
  DIVIDEND
  FCF
  REVENUE
}

type Query {
  dashboardPortfolios: [DashboardPortfolio!]!
  portfolioDashboardSummary(portfolioId: ID!): DashboardSummary!
  portfolioPriceSeries(
    portfolioId: ID!
    horizon: DashboardHorizon!
  ): PriceSeriesPayload!
  portfolioFourPrice(portfolioId: ID!): FourPricePayload!
  portfolioRisk(portfolioId: ID!): RiskPayload!
  portfolioMovers(portfolioId: ID!, count: Int = 3): MoversPayload!
  portfolioExpectedReturn(
    portfolioId: ID!
    count: Int = 3
  ): ExpectedReturnPayload!
  deploymentSummary(portfolioId: ID!): DeploymentPayload!
  portfolioSectorWeights(
    portfolioId: ID!
    horizon: DashboardHorizon!
  ): SectorWeightsPayload!
}
```

Each panel's query is named at the end of its §3 entry.

## 5. Sample data

All five portfolios are served. EQUITY is the full twelve-name book and the
default: its trade date is 2026-08-12, every panel's as-of date is 2026-09-01,
and weights sum to 1.00 including cash. Every figure on the page is derived from
the one table below, which is why the panels agree with each other — the
treemap's weights are the Rebalancer's weights, and the movers' contributions
sum to the header's return. The data and the derivations live in
`packages/mock-data`.

| Ticker | Name              | Sector                 | TW   | Price  | PT  | ER    | Return since trade | Vol (ann.) |
| ------ | ----------------- | ---------------------- | ---- | ------ | --- | ----- | ------------------ | ---------- |
| NVDA   | NVIDIA            | Technology             | 0.12 | 118.40 | 150 | 0.267 | +0.041             | 0.48       |
| MSFT   | Microsoft         | Technology             | 0.10 | 505.00 | 560 | 0.109 | +0.008             | 0.22       |
| ABBV   | AbbVie            | Healthcare             | 0.09 | 212.55 | 240 | 0.129 | +0.012             | 0.21       |
| AMZN   | Amazon            | Consumer Cyclical      | 0.09 | 228.00 | 270 | 0.184 | +0.024             | 0.30       |
| PLTR   | Palantir          | Technology             | 0.08 | 158.20 | 175 | 0.106 | −0.062             | 0.62       |
| GOOGL  | Alphabet          | Communication Services | 0.08 | 212.00 | 240 | 0.132 | +0.030             | 0.27       |
| SOFI   | SoFi Technologies | Financial Services     | 0.07 | 26.80  | 32  | 0.194 | +0.125             | 0.55       |
| CAT    | Caterpillar       | Industrials            | 0.07 | 415.00 | 450 | 0.084 | +0.019             | 0.26       |
| DUOL   | Duolingo          | Technology             | 0.06 | 342.10 | 420 | 0.228 | +0.093             | 0.50       |
| HOOD   | Robinhood         | Financial Services     | 0.06 | 112.30 | 130 | 0.158 | +0.119             | 0.60       |
| UNH    | UnitedHealth      | Healthcare             | 0.06 | 305.00 | 380 | 0.246 | −0.048             | 0.33       |
| XOM    | Exxon Mobil       | Energy                 | 0.06 | 112.00 | 125 | 0.116 | −0.021             | 0.24       |
| CASH   | Cash              | Cash                   | 0.06 | —      | —   | 0     | 0                  | 0          |

Figures that follow from the table:

- **Header:** 12 holdings; since-trade return 0.0251 (Σ TW × return); not
  flow-adjusted.
- **Movers:** top SOFI / HOOD / DUOL, bottom PLTR / UNH / XOM. The top three
  explain 0.855 of the return and the bottom three −0.363.
- **Expected return:** portfolio ER 0.1545 over 0.94 of weight. Top contributors
  NVDA / AMZN / UNH, bottom CAT / XOM / PLTR. Two stale price targets: UNH
  (target set 2026-07-02, earnings 2026-07-29) and CAT (target 2026-07-15,
  earnings 2026-08-05).
- **Sectors (weight):** Technology 0.36, Healthcare 0.15, Financial Services
  0.13, Consumer Cyclical 0.09, Communication Services 0.08, Industrials 0.07,
  Energy 0.06, Cash 0.06. YTD returns: Technology −0.10 (−0.18 against the S&P
  500's +0.08), Financial Services +0.21, Healthcare −0.04.
- **Risk:** one-day VaR95 −0.0142, VaR99 −0.0231, ES95 −0.0198, ES99 −0.0304;
  ten-day figures are × √10. GARCH volatility 0.0121 daily, 0.192 annualized.
  Weighted volatility 0.35 over 0.94 of weight. Most correlated pairs SOFI |
  HOOD 0.65, NVDA | PLTR 0.58, MSFT | GOOGL 0.55; least XOM | DUOL −0.08, ABBV |
  NVDA 0.02, UNH | SOFI 0.05. The window is 320 of a requested 500 days, because
  DUOL has 320 days of history.
- **Dividend payers:** NVDA, MSFT, ABBV, GOOGL, CAT, UNH, XOM — 7 of 12,
  covering 0.58 of target weight and 0.60 of ER weight. Both clear the 50 %
  tier, so EQUITY's pDIV is not an empty state; DIVIDEND carries that case.
- **4P by target weight:** rev 6.8, fcf 28.4, ern 31.2, div 92.5. Against the
  S&P 500 (503 constituents) the percentiles are 0.82 / 0.71 / 0.74 / 0.88.
- **Deployment:** 312 accounts, 187 clients, AUM $184.3M. Gain/loss: 1M $2.15M
  (0.0118), YTD $16.9M (0.1009), 1Y $24.4M (0.1526). 1D is always `null` with
  "Not available for this horizon".
- **Price series:** SINCE_TRADE starts at the trade date and the portfolio line
  ends exactly at the header's 0.0251; SPY ends at 0.0134. ALL starts at
  EQUITY's inception, 2021-03-01, and is downsampled to at most 260 points. The
  factor index series is always empty, with the reason "Index series not
  available before 2026-08-20" — the Price Action empty state.

The other four portfolios are smaller books (seven names plus cash). They exist
so the selector has something to switch between, and so that every panel's empty
state has data behind it — EQUITY alone would leave four of the seven panels
with sad paths that never render:

| Portfolio               | Empty state it carries                                                                    | Exercises                                                                                 |
| ----------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| EARNINGS (`p-earnings`) | No trade date: `tradeDate` and `returnSinceTrade` are `null`                              | §3.1 "Trade date not set"; §3.5 "Set a trade date on Drift to see movers"                 |
| DIVIDEND (`p-dividend`) | pDIV coverage 0.18 of weight (2 payers of 7); pFCF coverage 0.41                          | §3.3 both coverage tiers — a dash below 25 %, grey below 50 %                             |
| FCF (`p-fcf`)           | Since-trade return of 0.0004                                                              | §3.5 "n/a (portfolio flat)"                                                               |
| REVENUE (`p-revenue`)   | Two holdings with no price target; no GARCH estimate; one holding priced above its target | §3.6 "no target" list; §3.4 GARCH non-convergence; the ER ≤ 0 exclusion in Definitions #2 |

### 5.1 Example payloads

Taken from the running mock for EQUITY and abridged where arrays repeat
(`/* … */`). Numbers are rounded to six decimals here; the API returns full
precision.

```jsonc
// dashboardPortfolios
[
  { "id": "p-equity", "code": "EQUITY", "name": "Sample Equity" },
  { "id": "p-earnings", "code": "EARNINGS", "name": "Sample Earnings" },
  { "id": "p-dividend", "code": "DIVIDEND", "name": "Sample Dividend" },
  { "id": "p-fcf", "code": "FCF", "name": "Sample Free Cash Flow" },
  { "id": "p-revenue", "code": "REVENUE", "name": "Sample Revenue" }
]

// portfolioDashboardSummary(portfolioId: "p-equity")
{
  "portfolio": { "id": "p-equity", "code": "EQUITY", "name": "Sample Equity" },
  "holdingsCount": 12,
  "tradeDate": "2026-08-12",
  "returnSinceTrade": {
    "baselineDate": "2026-08-12",
    "latestDate": "2026-09-01",
    "returnPct": 0.0251,
    "flowAdjusted": false
  },
  "asOf": "2026-09-01"
}

// portfolioPriceSeries(portfolioId: "p-equity", horizon: SINCE_TRADE)
{
  "horizon": "SINCE_TRADE",
  "windowStart": "2026-08-12",
  "series": [
    {
      "id": "EQUITY",
      "label": "EQUITY",
      "kind": "PORTFOLIO",
      "points": [
        { "date": "2026-08-12", "value": 0 },
        { "date": "2026-08-13", "value": 0.002629 },
        /* … */,
        { "date": "2026-09-01", "value": 0.0251 }
      ],
      "reason": null
    },
    {
      "id": "SPY",
      "label": "S&P 500 (SPY)",
      "kind": "BENCHMARK",
      "points": [
        { "date": "2026-08-12", "value": 0 },
        { "date": "2026-08-13", "value": 0.00288 },
        /* … */,
        { "date": "2026-09-01", "value": 0.0134 }
      ],
      "reason": null
    },
    {
      "id": "FACTOR",
      "label": "Factor composite",
      "kind": "INDEX",
      "points": [],
      "reason": "Index series not available before 2026-08-20"
    }
  ],
  "asOf": "2026-09-01"
}

// portfolioFourPrice(portfolioId: "p-equity")  // reason omitted: null wherever multiple is present
{
  "byTargetWeight": {
    "rev": { "multiple": 6.8, "coverageWeight": 0.94, "coveredHoldings": 12, "totalHoldings": 12 },
    "fcf": { "multiple": 28.4, "coverageWeight": 0.88, "coveredHoldings": 11, "totalHoldings": 12 },
    "ern": { "multiple": 31.2, "coverageWeight": 0.94, "coveredHoldings": 12, "totalHoldings": 12 },
    "div": { "multiple": 92.5, "coverageWeight": 0.58, "coveredHoldings": 7, "totalHoldings": 12 }
  },
  "byWeightedEr": {
    "rev": { "multiple": 7.4, "coverageWeight": 1, "coveredHoldings": 12, "totalHoldings": 12 },
    "fcf": { "multiple": 30.1, "coverageWeight": 0.911572, "coveredHoldings": 11, "totalHoldings": 12 },
    "ern": { "multiple": 33.9, "coverageWeight": 1, "coveredHoldings": 12, "totalHoldings": 12 },
    "div": { "multiple": 99.8, "coverageWeight": 0.600169, "coveredHoldings": 7, "totalHoldings": 12 }
  },
  "vsSp500": {
    "universe": "S&P 500",
    "constituents": 503,
    "rev": { "percentile": 0.82, "zScore": 1.1, "universeMean": 3.9, "universeStdDev": 2.6 },
    "fcf": { "percentile": 0.71, "zScore": 0.6, "universeMean": 24, "universeStdDev": 7.3 },
    "ern": { "percentile": 0.74, "zScore": 0.7, "universeMean": 26.5, "universeStdDev": 6.7 },
    "div": { "percentile": 0.88, "zScore": 1.3, "universeMean": 52, "universeStdDev": 31 }
  },
  "vsIndex": {
    "universe": "Factor composite",
    "constituents": 148,
    "rev": { "percentile": 0.61, "zScore": 0.3, "universeMean": 5.9, "universeStdDev": 3 },
    "fcf": { "percentile": 0.55, "zScore": 0.1, "universeMean": 27.6, "universeStdDev": 8.1 },
    "ern": { "percentile": 0.58, "zScore": 0.2, "universeMean": 29.8, "universeStdDev": 7 },
    "div": { "percentile": 0.7, "zScore": 0.5, "universeMean": 71, "universeStdDev": 43 }
  },
  "asOf": "2026-09-01"
}

// portfolioRisk(portfolioId: "p-equity")
{
  "windowDays": 320,
  "requestedWindowDays": 500,
  "windowNote": "Window shortened to 320 days because DUOL has 320 days of history.",
  "var95": -0.0142,
  "var99": -0.0231,
  "es95": -0.0198,
  "es99": -0.0304,
  "var95TenDay": -0.044904,
  "var99TenDay": -0.073049,
  "es95TenDay": -0.062613,
  "es99TenDay": -0.096133,
  "garchVolDaily": 0.0121,
  "garchVolAnnualized": 0.192082,
  "garchReason": null,
  "weightedVolAnnualized": 0.3536,
  "weightedVolCoverage": 0.94,
  "topCorrelations": [
    { "a": "SOFI", "b": "HOOD", "rho": 0.65 },
    { "a": "NVDA", "b": "PLTR", "rho": 0.58 },
    { "a": "MSFT", "b": "GOOGL", "rho": 0.55 }
  ],
  "bottomCorrelations": [
    { "a": "XOM", "b": "DUOL", "rho": -0.08 },
    { "a": "ABBV", "b": "NVDA", "rho": 0.02 },
    { "a": "UNH", "b": "SOFI", "rho": 0.05 }
  ],
  "asOf": "2026-09-01"
}

// portfolioMovers(portfolioId: "p-equity", count: 3)
{
  "tradeDate": "2026-08-12",
  "baselineDate": "2026-08-12",
  "top": [
    {
      "ticker": "SOFI",
      "name": "SoFi Technologies",
      "returnSinceTrade": 0.125,
      "targetWeight": 0.07,
      "currentWeight": 0.077,
      "driftPp": 0.7,
      "contribution": 0.00875
    },
    {
      "ticker": "HOOD",
      "name": "Robinhood",
      "returnSinceTrade": 0.119,
      "targetWeight": 0.06,
      "currentWeight": 0.065,
      "driftPp": 0.5,
      "contribution": 0.00714
    },
    {
      "ticker": "DUOL",
      "name": "Duolingo",
      "returnSinceTrade": 0.093,
      "targetWeight": 0.06,
      "currentWeight": 0.064,
      "driftPp": 0.4,
      "contribution": 0.00558
    }
  ],
  "bottom": [
    {
      "ticker": "PLTR",
      "name": "Palantir",
      "returnSinceTrade": -0.062,
      "targetWeight": 0.08,
      "currentWeight": 0.073,
      "driftPp": -0.7,
      "contribution": -0.00496
    },
    {
      "ticker": "UNH",
      "name": "UnitedHealth",
      "returnSinceTrade": -0.048,
      "targetWeight": 0.06,
      "currentWeight": 0.056,
      "driftPp": -0.4,
      "contribution": -0.00288
    },
    {
      "ticker": "XOM",
      "name": "Exxon Mobil",
      "returnSinceTrade": -0.021,
      "targetWeight": 0.06,
      "currentWeight": 0.057,
      "driftPp": -0.3,
      "contribution": -0.00126
    }
  ],
  "attribution": { "portfolioReturn": 0.0251, "topShare": 0.855378, "bottomShare": -0.36255, "reason": null },
  "reason": null,
  "asOf": "2026-09-01"
}

// portfolioExpectedReturn(portfolioId: "p-equity", count: 3)
{
  "portfolioEr": 0.154505,
  "coveredWeight": 0.94,
  "topContributors": [
    {
      "ticker": "NVDA",
      "targetWeight": 0.12,
      "price": 118.4,
      "priceTarget": 150,
      "er": 0.266892,
      "contribution": 0.032027
    },
    {
      "ticker": "AMZN",
      "targetWeight": 0.09,
      "price": 228,
      "priceTarget": 270,
      "er": 0.184211,
      "contribution": 0.016579
    },
    {
      "ticker": "UNH",
      "targetWeight": 0.06,
      "price": 305,
      "priceTarget": 380,
      "er": 0.245902,
      "contribution": 0.014754
    }
  ],
  "bottomContributors": [
    {
      "ticker": "CAT",
      "targetWeight": 0.07,
      "price": 415,
      "priceTarget": 450,
      "er": 0.084337,
      "contribution": 0.005904
    },
    {
      "ticker": "XOM",
      "targetWeight": 0.06,
      "price": 112,
      "priceTarget": 125,
      "er": 0.116071,
      "contribution": 0.006964
    },
    {
      "ticker": "PLTR",
      "targetWeight": 0.08,
      "price": 158.2,
      "priceTarget": 175,
      "er": 0.106195,
      "contribution": 0.008496
    }
  ],
  "noTarget": [],
  "stalePriceTargets": {
    "count": 2,
    "tickers": [
      { "ticker": "UNH", "priceTargetDate": "2026-07-02", "lastEarningsDate": "2026-07-29" },
      { "ticker": "CAT", "priceTargetDate": "2026-07-15", "lastEarningsDate": "2026-08-05" }
    ]
  },
  "asOf": "2026-09-01"
}

// deploymentSummary(portfolioId: "p-equity")
{
  "accountsCount": 312,
  "clientsCount": 187,
  "aum": { "value": 184300000, "asOf": "2026-09-01", "source": "ACCOUNTING_SYSTEM", "reason": null },
  "gainLoss": [
    { "horizon": "ONE_DAY", "value": null, "pct": null, "reason": "Not available for this horizon" },
    { "horizon": "ONE_MONTH", "value": 2150000, "pct": 0.0118, "reason": null },
    { "horizon": "YTD", "value": 16900000, "pct": 0.1009, "reason": null },
    { "horizon": "ONE_YEAR", "value": 24400000, "pct": 0.1526, "reason": null }
  ],
  "asOf": "2026-09-01"
}

// portfolioSectorWeights(portfolioId: "p-equity", horizon: YTD)
{
  "horizon": "YTD",
  "benchmarkReturn": 0.08,
  "sectors": [
    {
      "name": "Technology",
      "weight": 0.36,
      "return": -0.100222,
      "vsBenchmark": -0.180222,
      "isCash": false,
      "holdings": ["NVDA", "MSFT", "PLTR", "DUOL"]
    },
    {
      "name": "Healthcare",
      "weight": 0.15,
      "return": -0.04,
      "vsBenchmark": -0.12,
      "isCash": false,
      "holdings": ["ABBV", "UNH"]
    },
    {
      "name": "Financial Services",
      "weight": 0.13,
      "return": 0.21,
      "vsBenchmark": 0.13,
      "isCash": false,
      "holdings": ["SOFI", "HOOD"]
    },
    {
      "name": "Consumer Cyclical",
      "weight": 0.09,
      "return": 0.06,
      "vsBenchmark": -0.02,
      "isCash": false,
      "holdings": ["AMZN"]
    },
    {
      "name": "Communication Services",
      "weight": 0.08,
      "return": 0.11,
      "vsBenchmark": 0.03,
      "isCash": false,
      "holdings": ["GOOGL"]
    },
    {
      "name": "Industrials",
      "weight": 0.07,
      "return": 0.09,
      "vsBenchmark": 0.01,
      "isCash": false,
      "holdings": ["CAT"]
    },
    {
      "name": "Energy",
      "weight": 0.06,
      "return": -0.03,
      "vsBenchmark": -0.11,
      "isCash": false,
      "holdings": ["XOM"]
    },
    {
      "name": "Cash",
      "weight": 0.06,
      "return": null,
      "vsBenchmark": null,
      "isCash": true,
      "holdings": ["CASH"]
    }
  ],
  "holdings": [
    {
      "ticker": "NVDA",
      "name": "NVIDIA",
      "sector": "Technology",
      "weight": 0.12,
      "return": -0.06,
      "isCash": false
    },
    /* … */,
    {
      "ticker": "CASH",
      "name": "Cash",
      "sector": "Cash",
      "weight": 0.06,
      "return": null,
      "isCash": true
    }
  ],
  "asOf": "2026-09-01"
}
```

## 6. Non-functional

- **Loading:** each card loads independently; a slow panel never blocks the
  others.
- **Errors:** a failed card shows its own error and a retry; the page never
  blanks.
- **Performance:** first paint under 1 s on mock data; charts render ≤ 260
  points per line.
- **Accessibility:** every chart has a text summary (the numbers in the card);
  color is never the only carrier of sign — pair with the sign glyph.
- **Persistence:** selected portfolio and horizon persist per browser (local
  storage).

## 7. Out of scope for v1

Rebalance action button · Sharpe ratio, HHI, implied-volatility illustrations ·
intraday/live prices · client-level gain/loss · editing anything from this page.

---

## Definitions

Choices where more than one definition is reasonable. The mock implements the
option in **bold**; the alternatives are listed so you know what the numbers
are, and are not.

1.  Comparison index for EQUITY on Price Action and 4P: **equal-weighted
    composite of REV/FCF/ERN/DIV indices**, or one of them.
2.  WER: **TW × ER renormalized, excluding holdings with ER ≤ 0** (see §3.3);
    alternative: ER-rank weights, which has no sign problem but changes every
    4P·WER figure.
3.  ER basis: **raw upside (PT − price) ÷ price**; alternative: annualized to
    the target date.
4.  4P aggregation: **weighted harmonic mean**; alternative: arithmetic weighted
    mean.
5.  Percentile universe for "S&P": **official S&P 500 constituents** (mock
    assumes 503 names); fallback if no feed: top-500 US names by market cap.
6.  Short-history policy for VOLcano: **shorten the window to the shortest
    holding and say so**; alternatives: exclude the holding, or hard minimum of
    500 days.
7.  Portfolio volatility: **Σ wᵢσᵢ**; alternative: √(wᵀΣw) from the covariance
    matrix.
8.  Attribution weights: **target weights**; alternative: actual weights on the
    trade date.
9.  AUM scope: **assets in the model's accounts**; alternative: firm-wide manual
    figure.
10. Since-trade return: **ship with the "not flow-adjusted" disclosure**;
    alternative: wait for flow-adjusted data.
11. Holiday trade date: **snap the baseline forward to the next close and log
    it**, accepting that the first trading day's move drops out of the headline
    figure (see §3.1); alternatives: snap backward, or refuse to show a figure.
12. 4P coverage tiers: **grey below 50 % of weight, dash below 25 %** (see
    §3.3); alternatives: a single 50 % dash threshold, or grey only and never
    suppress.
13. Portfolio VaR breach colouring: **none in v1** (see §3.4); alternatives: add
    a `tenDayThreshold` field, or colour against a fixed house risk limit.
14. ALL window anchor: **model inception (the first day the portfolio has a
    value), with every series sharing that rebase point** (see §3.2);
    alternatives: the earliest date _all_ visible series have data (shortens the
    window to the youngest series), or a fixed lookback such as 10 years.
