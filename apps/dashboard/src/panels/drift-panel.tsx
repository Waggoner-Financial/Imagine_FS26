import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { execute } from '../api/client';
import { moversDocument } from '../api/queries';
import { Card } from '../components/card';
import { Stat } from '../components/stat';
import type { MoversQuery } from '../generated/graphql';
import {
  formatDate,
  formatPercent,
  formatSignedPercent,
  MISSING,
} from '../lib/format';

type Movers = MoversQuery['portfolioMovers'];
type Mover = Movers['top'][number];

// Drift arrives in percentage points, not as a fraction: 0.7 -> "+0.7 pp".
const driftFormat = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
  signDisplay: 'exceptZero',
});

function formatDriftPp(value: number | null | undefined): string {
  return value == null ? MISSING : `${driftFormat.format(value)} pp`;
}

function shareText(
  share: number | null | undefined,
  reason: string | null | undefined
): string {
  return share == null ? (reason ?? MISSING) : formatSignedPercent(share);
}

function MoverTable({
  caption,
  movers,
}: {
  caption: string;
  movers: readonly Mover[];
}): ReactNode {
  return (
    <table className="movers">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">Ticker</th>
          <th scope="col">Return</th>
          <th scope="col">Weight</th>
          <th scope="col">Drift</th>
        </tr>
      </thead>
      <tbody>
        {movers.map((mover) => (
          <tr key={mover.ticker}>
            <th scope="row">
              <a href={`/stocks/${mover.ticker}`} title={mover.name}>
                {mover.ticker}
              </a>
            </th>
            <td>{formatSignedPercent(mover.returnSinceTrade)}</td>
            <td>{formatPercent(mover.currentWeight)}</td>
            <td>{formatDriftPp(mover.driftPp)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DriftBody({ movers }: { movers: Movers }): ReactNode {
  if (movers.reason != null) {
    return <p>{movers.reason}</p>;
  }

  const attribution = movers.attribution;
  return (
    <>
      <p>Since the close of {formatDate(movers.baselineDate)}</p>
      <MoverTable caption="Top movers" movers={movers.top} />
      <MoverTable caption="Bottom movers" movers={movers.bottom} />
      <dl className="stats">
        <Stat
          label="Top 3 explain"
          value={shareText(attribution?.topShare, attribution?.reason)}
        />
        <Stat
          label="Bottom 3 explain"
          value={shareText(attribution?.bottomShare, attribution?.reason)}
        />
      </dl>
    </>
  );
}

// Drift (spec §3.5): the top and bottom three movers since the trade date,
// each with its current weight and drift from target, and the share of the
// since-trade return each group explains.
export function DriftPanel({
  portfolioId,
}: {
  portfolioId: string;
}): ReactNode {
  const { data, error, isPending, refetch } = useQuery({
    queryFn: () => execute(moversDocument, { portfolioId }),
    queryKey: ['movers', portfolioId],
  });

  const movers = data?.portfolioMovers;

  return (
    <Card
      title="Drift"
      asOf={movers?.asOf}
      error={error}
      isLoading={isPending}
      onRetry={() => {
        void refetch();
      }}
    >
      {movers !== undefined && <DriftBody movers={movers} />}
    </Card>
  );
}
