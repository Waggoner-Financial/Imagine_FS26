import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { execute } from './api/client';
import { portfoliosDocument } from './api/queries';
import { PlaceholderPanel } from './components/placeholder-panel';
import { PortfolioHeader } from './components/portfolio-header';
import type { DashboardHorizon } from './generated/graphql';
import { isHorizon } from './lib/horizons';
import { usePersistedState } from './lib/use-persisted-state';
import { DeploymentPanel } from './panels/deployment-panel';

// EQUITY is the default portfolio (spec §1).
const DEFAULT_PORTFOLIO_ID = 'p-equity';
const DEFAULT_HORIZON: DashboardHorizon = 'YTD';

function isNonEmpty(value: string): value is string {
  return value !== '';
}

// The page: the header, then seven panels in a responsive grid (spec §2).
// The selected portfolio and horizon live here and flow down as props; both
// persist across reloads.
export function App(): ReactNode {
  const portfolios = useQuery({
    queryFn: () => execute(portfoliosDocument),
    queryKey: ['portfolios'],
  });
  const [storedPortfolioId, setPortfolioId] = usePersistedState(
    'dashboard.portfolio',
    DEFAULT_PORTFOLIO_ID,
    isNonEmpty
  );
  const [horizon, setHorizon] = usePersistedState<DashboardHorizon>(
    'dashboard.horizon',
    DEFAULT_HORIZON,
    isHorizon
  );

  const list = portfolios.data?.dashboardPortfolios ?? [];
  // A remembered portfolio the API no longer offers falls back to the default.
  const portfolioId =
    list.length === 0 || list.some((p) => p.id === storedPortfolioId)
      ? storedPortfolioId
      : DEFAULT_PORTFOLIO_ID;

  return (
    <div className="page">
      <PortfolioHeader
        horizon={horizon}
        portfolioId={portfolioId}
        portfolios={list}
        onHorizonChange={setHorizon}
        onPortfolioChange={setPortfolioId}
      />
      {portfolios.error != null && (
        <p className="page-error" role="alert">
          Could not load the portfolio list: {portfolios.error.message}
        </p>
      )}
      <main className="grid">
        <PlaceholderPanel
          title="Price Action"
          section="§3.2"
          query="portfolioPriceSeries"
          horizon={horizon}
        />
        <PlaceholderPanel
          title="Portfolio 4P"
          section="§3.3"
          query="portfolioFourPrice"
        />
        <PlaceholderPanel
          title="VOLcano"
          section="§3.4"
          query="portfolioRisk"
        />
        <PlaceholderPanel
          title="Drift"
          section="§3.5"
          query="portfolioMovers"
        />
        <PlaceholderPanel
          title="Rebalancer"
          section="§3.6"
          query="portfolioExpectedReturn"
        />
        <DeploymentPanel portfolioId={portfolioId} />
        <PlaceholderPanel
          title="Sector / Holdings"
          section="§3.8"
          query="portfolioSectorWeights"
          horizon={horizon}
        />
      </main>
    </div>
  );
}
