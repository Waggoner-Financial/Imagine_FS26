import { useQuery } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';

import { execute } from '../api/client';
import { deploymentDocument } from '../api/queries';
import { Card } from '../components/card';
import { SegmentedControl } from '../components/segmented-control';
import { Stat } from '../components/stat';
import type { AumSource, DashboardHorizon } from '../generated/graphql';
import {
  formatCount,
  formatMoney,
  formatSignedMoney,
  formatSignedPercent,
} from '../lib/format';
import type { Option } from '../lib/horizons';

// The card's own gain/loss toggle (spec §3.7). It does not follow the global
// horizon. 1D is deliberately present even though it never has a value: it
// is this panel's empty state.
const GAIN_LOSS_HORIZONS: readonly Option<DashboardHorizon>[] = [
  { label: '1D', value: 'ONE_DAY' },
  { label: '1M', value: 'ONE_MONTH' },
  { label: 'YTD', value: 'YTD' },
  { label: '1Y', value: 'ONE_YEAR' },
];

const AUM_SOURCE_LABELS: Record<AumSource, string> = {
  ACCOUNTING_SYSTEM: 'From the accounting system',
  MANUAL: 'Entered manually',
};

// Deployment (spec §3.7): accounts, clients, AUM and aggregate gain/loss.
// This is the one complete panel in the starter; the others follow the same
// shape: a typed query keyed by portfolio, rendered inside a Card that owns
// the loading, error and as-of states.
export function DeploymentPanel({
  portfolioId,
}: {
  portfolioId: string;
}): ReactNode {
  const [horizon, setHorizon] = useState<DashboardHorizon>('YTD');
  const { data, error, isPending, refetch } = useQuery({
    queryFn: () => execute(deploymentDocument, { portfolioId }),
    queryKey: ['deployment', portfolioId],
  });

  const deployment = data?.deploymentSummary;
  const gainLoss = deployment?.gainLoss.find(
    (entry) => entry.horizon === horizon
  );
  const horizonText =
    GAIN_LOSS_HORIZONS.find((option) => option.value === horizon)?.label ??
    horizon;

  return (
    <Card
      title="Deployment"
      asOf={deployment?.asOf}
      error={error}
      isLoading={isPending}
      onRetry={() => {
        void refetch();
      }}
      actions={
        <SegmentedControl
          label="Gain/loss horizon"
          options={GAIN_LOSS_HORIZONS}
          value={horizon}
          onChange={setHorizon}
        />
      }
    >
      {deployment !== undefined && (
        <dl className="stats">
          <Stat
            label="Accounts"
            value={formatCount(deployment.accountsCount)}
          />
          <Stat label="Clients" value={formatCount(deployment.clientsCount)} />
          <Stat
            label="AUM"
            value={formatMoney(deployment.aum.value)}
            note={
              deployment.aum.value == null
                ? deployment.aum.reason
                : AUM_SOURCE_LABELS[deployment.aum.source]
            }
          />
          <Stat
            label={`Gain/loss (${horizonText})`}
            value={formatSignedMoney(gainLoss?.value)}
            note={
              gainLoss?.value == null
                ? gainLoss?.reason
                : formatSignedPercent(gainLoss.pct)
            }
          />
        </dl>
      )}
    </Card>
  );
}
