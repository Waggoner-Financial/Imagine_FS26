import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { execute } from '../api/client';
import { summaryDocument } from '../api/queries';
import type {
  DashboardHorizon,
  PortfoliosQuery,
  SummaryQuery,
} from '../generated/graphql';
import { formatDate, formatSignedPercent, MISSING } from '../lib/format';
import { HORIZONS } from '../lib/horizons';
import { SegmentedControl } from './segmented-control';

// Shown with the since-trade return, always (spec §3.1).
const DISCLOSURE =
  'Raw change in portfolio value; contributions and withdrawals read as performance.';

type Portfolio = PortfoliosQuery['dashboardPortfolios'][number];
type Summary = SummaryQuery['portfolioDashboardSummary'];

type PortfolioHeaderProps = {
  horizon: DashboardHorizon;
  onHorizonChange: (horizon: DashboardHorizon) => void;
  onPortfolioChange: (portfolioId: string) => void;
  portfolioId: string;
  portfolios: readonly Portfolio[];
};

// The page header (spec §3.1): the portfolio selector, holdings count, the
// return since the last trade, and the global horizon toggle. Changing the
// portfolio re-runs every panel's query, because each one is keyed by it.
export function PortfolioHeader({
  horizon,
  onHorizonChange,
  onPortfolioChange,
  portfolioId,
  portfolios,
}: PortfolioHeaderProps): ReactNode {
  const summary = useQuery({
    queryFn: () => execute(summaryDocument, { portfolioId }),
    queryKey: ['summary', portfolioId],
  });
  const data = summary.data?.portfolioDashboardSummary;

  return (
    <header className="page-header">
      <div className="page-heading">
        <h1 className="page-title">Portfolio Dashboard</h1>
        <label className="portfolio-select">
          <span className="visually-hidden">Portfolio</span>
          <select
            value={portfolioId}
            disabled={portfolios.length === 0}
            onChange={(event) => {
              onPortfolioChange(event.target.value);
            }}
          >
            {portfolios.map((portfolio) => (
              <option key={portfolio.id} value={portfolio.id}>
                {portfolio.code} — {portfolio.name}
              </option>
            ))}
          </select>
        </label>
        {data !== undefined && (
          <p className="page-meta">
            {data.holdingsCount} holdings · <ReturnSinceTrade summary={data} />
          </p>
        )}
        {summary.error != null && (
          <p className="page-meta" role="alert">
            {summary.error.message}
          </p>
        )}
      </div>
      <SegmentedControl
        label="Horizon"
        options={HORIZONS}
        value={horizon}
        onChange={onHorizonChange}
      />
    </header>
  );
}

// The return since the last trade, or "Trade date not set" with a dash when
// the portfolio has none. The tooltip carries the dates and the disclosure.
function ReturnSinceTrade({ summary }: { summary: Summary }): ReactNode {
  const { returnSinceTrade, tradeDate } = summary;
  if (returnSinceTrade == null || tradeDate == null) {
    return (
      <span>
        Trade date not set <span className="pill">{MISSING}</span>
      </span>
    );
  }

  const tone = returnSinceTrade.returnPct >= 0 ? 'pill-up' : 'pill-down';
  const tooltip = `From the close of ${formatDate(returnSinceTrade.baselineDate)} to ${formatDate(returnSinceTrade.latestDate)}. ${DISCLOSURE}`;

  return (
    <span>
      Return since last trade ({formatDate(tradeDate)}){' '}
      <span className={`pill ${tone}`} title={tooltip}>
        {formatSignedPercent(returnSinceTrade.returnPct)}
      </span>
    </span>
  );
}
