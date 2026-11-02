import { useQuery } from '@tanstack/react-query';
import { type ReactNode, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { execute } from '../api/client';
import { priceSeriesDocument } from '../api/queries';
import { Card } from '../components/card';
import type {
  DashboardHorizon,
  PriceSeriesQuery,
  SeriesKind,
} from '../generated/graphql';
import {
  formatDate,
  formatPercent,
  formatSignedPercent,
  MISSING,
} from '../lib/format';
import {
  axisDateFormatter,
  type ChartRow,
  lastValue,
  SERIES_STYLE,
  toChartRows,
} from '../lib/price-series';

type Series = PriceSeriesQuery['portfolioPriceSeries']['series'][number];

const ALL_VISIBLE: Record<SeriesKind, boolean> = {
  BENCHMARK: true,
  INDEX: true,
  PORTFOLIO: true,
};

// Price Action (spec §3.2): cumulative return lines for the portfolio, the
// S&P 500 and the factor index over the global horizon, each rebased to 0 at
// the window start. Checkboxes toggle each line; a series the API could not
// supply shows a dash and its reason instead of a line.
export function PriceActionPanel({
  horizon,
  portfolioId,
}: {
  horizon: DashboardHorizon;
  portfolioId: string;
}): ReactNode {
  const [visible, setVisible] = useState(ALL_VISIBLE);
  const { data, error, isPending, refetch } = useQuery({
    queryFn: () => execute(priceSeriesDocument, { horizon, portfolioId }),
    queryKey: ['priceSeries', portfolioId, horizon],
  });

  const payload = data?.portfolioPriceSeries;
  // With no series at all (no trade date), windowStart is only a placeholder,
  // so neither the chart nor the rebase caption has anything true to say.
  const hasData =
    payload?.series.some((line) => line.points.length > 0) ?? false;
  // The lines to draw: checked and non-empty. Memoized so the chart's merged
  // rows are only rebuilt when the data or a checkbox changes.
  const drawn = useMemo(
    () =>
      payload?.series.filter(
        (line) => visible[line.kind] && line.points.length > 0
      ) ?? [],
    [payload, visible]
  );

  return (
    <Card
      title="Price Action"
      asOf={payload?.asOf}
      error={error}
      isLoading={isPending}
      onRetry={() => {
        void refetch();
      }}
    >
      {payload !== undefined && (
        <>
          <SeriesLegend
            series={payload.series}
            visible={visible}
            onToggle={(kind) => {
              setVisible((current) => ({ ...current, [kind]: !current[kind] }));
            }}
          />
          <PriceChart
            series={drawn}
            hasData={hasData}
            windowStart={payload.windowStart}
            asOf={payload.asOf}
          />
          {hasData && (
            <p className="price-caption">
              Cumulative total return, rebased to 0% on{' '}
              {formatDate(payload.windowStart)}.
            </p>
          )}
        </>
      )}
    </Card>
  );
}

// One checkbox per series. Each shows where its line ends, which doubles as
// the chart's text summary (spec §6); an empty series gets a disabled
// checkbox, a dash and the API's reason.
function SeriesLegend({
  onToggle,
  series,
  visible,
}: {
  onToggle: (kind: SeriesKind) => void;
  series: readonly Series[];
  visible: Record<SeriesKind, boolean>;
}): ReactNode {
  return (
    <ul className="price-legend">
      {series.map((line) => {
        const end = lastValue(line);
        const style = SERIES_STYLE[line.kind];
        return (
          <li key={line.id}>
            <label>
              <input
                type="checkbox"
                checked={end !== null && visible[line.kind]}
                disabled={end === null}
                onChange={() => {
                  onToggle(line.kind);
                }}
              />
              <svg className="price-swatch" aria-hidden="true">
                <line
                  x1="0"
                  x2="20"
                  y1="5"
                  y2="5"
                  stroke={style.color}
                  strokeDasharray={style.dash}
                />
              </svg>
              <span>{line.label}</span>
              <strong className="price-legend-value">
                {end === null ? MISSING : formatSignedPercent(end)}
              </strong>
            </label>
            {end === null && line.reason != null && (
              <span className="price-legend-reason">{line.reason}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// The line chart itself. `series` holds only the lines to draw. With nothing
// to draw the chart is replaced by a message: either the API returned no
// points for any series (e.g. the Trade horizon on a portfolio with no trade
// date), or the user has unchecked every line.
function PriceChart({
  asOf,
  hasData,
  series,
  windowStart,
}: {
  asOf: string;
  hasData: boolean;
  series: readonly Series[];
  windowStart: string;
}): ReactNode {
  const rows = useMemo(() => toChartRows(series), [series]);
  const formatTick = useMemo(
    () => axisDateFormatter(windowStart, asOf),
    [windowStart, asOf]
  );

  if (series.length === 0) {
    return (
      <p className="price-empty">
        {hasData ? 'Select a line to plot.' : 'No price data for this horizon.'}
      </p>
    );
  }

  return (
    <div className="price-chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={rows}
          margin={{ bottom: 0, left: 0, right: 8, top: 8 }}
        >
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="date"
            minTickGap={24}
            stroke="var(--muted)"
            tick={{ fontSize: 11 }}
            tickFormatter={formatTick}
          />
          <YAxis
            stroke="var(--muted)"
            tick={{ fontSize: 11 }}
            tickFormatter={(value: number) => formatPercent(value)}
            width={56}
          />
          <ReferenceLine y={0} stroke="var(--muted)" />
          <Tooltip
            cursor={{ stroke: 'var(--muted)' }}
            content={({ active, payload }) => {
              // Every entry's payload is the hovered row from `rows`.
              const row = payload?.[0]?.payload as ChartRow | undefined;
              return active && row !== undefined ? (
                <ChartTooltip row={row} series={series} />
              ) : null;
            }}
          />
          {series.map((line) => (
            <Line
              key={line.id}
              dataKey={line.id}
              name={line.label}
              type="linear"
              stroke={SERIES_STYLE[line.kind].color}
              strokeDasharray={SERIES_STYLE[line.kind].dash}
              strokeWidth={2}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// The crosshair readout: the hovered date and every visible line's value on
// it. Values are read from the merged row rather than Recharts' per-line
// entries, so a line with no point on that date shows a dash instead of
// disappearing.
function ChartTooltip({
  row,
  series,
}: {
  row: ChartRow;
  series: readonly Series[];
}): ReactNode {
  return (
    <div className="price-tooltip">
      <div className="price-tooltip-date">{formatDate(row.date)}</div>
      <dl>
        {series.map((line) => {
          const value = row[line.id];
          return (
            <div key={line.id}>
              <dt>{line.label}</dt>
              <dd>
                {typeof value === 'number'
                  ? formatSignedPercent(value)
                  : MISSING}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
