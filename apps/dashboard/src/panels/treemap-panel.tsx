import { useQuery } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';

import { execute } from '../api/client';
import { sectorWeightsDocument } from '../api/queries';
import { Card } from '../components/card';
import { SegmentedControl } from '../components/segmented-control';
import { TreemapChart } from '../components/treemap-chart';
import type { DashboardHorizon } from '../generated/graphql';
import { formatSignedPercent } from '../lib/format';
import { type Option } from '../lib/horizons';
import { holdingTiles, sectorTiles, type Tile } from '../lib/treemap';

type View = 'SECTOR' | 'HOLDING';

const VIEWS: readonly Option<View>[] = [
  { label: 'Sector', value: 'SECTOR' },
  { label: 'Holdings', value: 'HOLDING' },
];

const RETURN_WINDOW: Record<DashboardHorizon, string> = {
  ALL: 'return since inception',
  ONE_DAY: '1-day return',
  ONE_MONTH: '1-month return',
  ONE_YEAR: '1-year return',
  SINCE_TRADE: 'return since the trade date',
  YTD: 'year-to-date return',
};

export function TreemapPanel({
  horizon,
  portfolioId,
}: {
  horizon: DashboardHorizon;
  portfolioId: string;
}): ReactNode {
  const [view, setView] = useState<View>('SECTOR');
  const [zoomed, setZoomed] = useState<string | null>(null);
  const { data, error, isPending, refetch } = useQuery({
    queryFn: () => execute(sectorWeightsDocument, { horizon, portfolioId }),
    queryKey: ['sectorWeights', portfolioId, horizon],
  });

  const payload = data?.portfolioSectorWeights;

  const zoomedSector =
    view === 'SECTOR'
      ? payload?.sectors.find((s) => s.name === zoomed)
      : undefined;

  let tiles: Tile[] = [];
  if (payload !== undefined) {
    if (view === 'HOLDING') tiles = holdingTiles(payload.holdings);
    else if (zoomedSector !== undefined)
      tiles = holdingTiles(payload.holdings, zoomedSector.name);
    else tiles = sectorTiles(payload.sectors);
  }
  const missingReturns = tiles.some((i) => !i.isCash && i.return == null);
  return (
    <Card
      title="Sector / Holdings"
      asOf={payload?.asOf}
      error={error}
      isLoading={isPending}
      onRetry={() => {
        void refetch();
      }}
      actions={
        <SegmentedControl
          label="Treemap view"
          options={VIEWS}
          value={view}
          onChange={(next) => {
            setView(next);
            setZoomed(null);
          }}
        />
      }
    >
      {payload !== undefined && (
        <>
          {zoomedSector !== undefined && (
            <button
              type="button"
              className="treemap-back"
              onClick={() => setZoomed(null)}
            >
              ← All sectors · {zoomedSector.name}
            </button>
          )}
          <TreemapChart tiles={tiles} onZoom={setZoomed} />
          <p className="treemap-caption">
            (Area = weight, including cash. Colour = {RETURN_WINDOW[horizon]},
            excluding cash since it is neutral. S&amp;P 500{' '}
            {formatSignedPercent(payload.benchmarkReturn)} over the same
            window.)
            {missingReturns &&
              ' Some returns are not available for this horizon.'}
          </p>
        </>
      )}
    </Card>
  );
}
