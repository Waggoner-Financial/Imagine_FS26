import { useQuery } from '@tanstack/react-query';
import { type ReactNode, useId, useState } from 'react';

import { execute } from '../api/client';
import { fourPriceDocument } from '../api/queries';
import { Card } from '../components/card';
import { SegmentedControl } from '../components/segmented-control';
import type {
  FourPriceQuery,
  FourPriceRankingFieldsFragment,
  FourPriceValueFieldsFragment,
  RankStatFieldsFragment,
} from '../generated/graphql';
import { coverageTier } from '../lib/coverage';
import {
  formatMultiple,
  formatPercentile,
  formatZScore,
  MISSING,
} from '../lib/format';
import type { Option } from '../lib/horizons';

type Payload = FourPriceQuery['portfolioFourPrice'];
type Metric = 'div' | 'ern' | 'fcf' | 'rev';
type Universe = 'vsIndex' | 'vsSp500';

// Rows in the order the spec lists the four prices (spec §3.3).
const METRICS: readonly { key: Metric; label: string }[] = [
  { key: 'rev', label: 'pREV' },
  { key: 'fcf', label: 'pFCF' },
  { key: 'ern', label: 'pERN' },
  { key: 'div', label: 'pDIV' },
];

// The card's own ranking toggle. Like Deployment's horizon, it does not
// follow the global horizon and is not persisted (spec §2).
const UNIVERSES: readonly Option<Universe>[] = [
  { label: 'vs S&P 500', value: 'vsSp500' },
  { label: 'vs Index', value: 'vsIndex' },
];

// Portfolio 4P (spec §3.3): four valuation multiples aggregated two ways,
// by target weight (TW) and by expected-return weight (WER), and where the
// TW multiple ranks in the chosen universe.
export function FourPricePanel({
  portfolioId,
}: {
  portfolioId: string;
}): ReactNode {
  const [universe, setUniverse] = useState<Universe>('vsSp500');
  const { data, error, isPending, refetch } = useQuery({
    queryFn: () => execute(fourPriceDocument, { portfolioId }),
    queryKey: ['four-price', portfolioId],
  });

  const payload = data?.portfolioFourPrice;

  return (
    <Card
      title="Portfolio 4P"
      asOf={payload?.asOf}
      error={error}
      isLoading={isPending}
      onRetry={() => {
        void refetch();
      }}
      actions={
        <SegmentedControl
          label="Ranking universe"
          options={UNIVERSES}
          value={universe}
          onChange={setUniverse}
        />
      }
    >
      {payload !== undefined && (
        <FourPriceTable payload={payload} ranking={payload[universe]} />
      )}
    </Card>
  );
}

function FourPriceTable({
  payload,
  ranking,
}: {
  payload: Payload;
  ranking: FourPriceRankingFieldsFragment;
}): ReactNode {
  const notes = missingNotes(payload, ranking);
  const tipIdPrefix = useId();

  return (
    <>
      <table className="four-price-table">
        <thead>
          <tr>
            <th scope="col">
              <span className="visually-hidden">Multiple</span>
            </th>
            <th scope="col">
              <abbr title="Weighted by target weight">TW</abbr>
            </th>
            <th scope="col">
              <abbr title="Weighted by target weight × expected return">
                WER
              </abbr>
            </th>
            <th scope="col">
              <abbr title="Percentile of the TW multiple">Pctl</abbr>
            </th>
            <th scope="col">
              <abbr title="z-score of the TW multiple">z</abbr>
            </th>
          </tr>
        </thead>
        <tbody>
          {METRICS.map(({ key, label }) => {
            const tw = payload.byTargetWeight[key];
            const wer = payload.byWeightedEr[key];
            const stat = ranking[key];
            // The rank describes the TW multiple, so it cannot outlive it.
            const ranked = tw.multiple != null;

            const tipId = `${tipIdPrefix}-${key}`;

            // The metric name is a button so the coverage and universe
            // figures open on hover, keyboard focus and tap alike, and screen
            // readers announce them through aria-describedby.
            return (
              <tr key={key}>
                <th scope="row" className="four-price-metric">
                  <button
                    type="button"
                    aria-describedby={tipId}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') event.currentTarget.blur();
                    }}
                  >
                    {label}
                  </button>
                  <span role="tooltip" id={tipId} className="four-price-tip">
                    {rowTooltip(tw, wer, stat, ranking.universe)}
                  </span>
                </th>
                <MultipleCell value={tw} />
                <MultipleCell value={wer} />
                <td>{ranked ? formatPercentile(stat.percentile) : MISSING}</td>
                <td>{ranked ? formatZScore(stat.zScore) : MISSING}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {notes.length > 0 && (
        <ul className="four-price-notes">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}
      <p className="four-price-caption">
        Weighted harmonic mean of holding multiples. Percentile and z-score rank
        the TW multiple against {ranking.universe} ({ranking.constituents}{' '}
        names).
      </p>
    </>
  );
}

// A multiple as is, greyed with a "low coverage" label, or a dash whose
// reason is listed under the table.
function MultipleCell({
  value,
}: {
  value: FourPriceValueFieldsFragment;
}): ReactNode {
  const tier = coverageTier(value);
  if (tier === 'missing') return <td>{MISSING}</td>;
  if (tier === 'full') return <td>{formatMultiple(value.multiple)}</td>;
  return (
    <td className="four-price-low">
      {formatMultiple(value.multiple)}
      <span className="four-price-low-label">low coverage</span>
    </td>
  );
}

// The reasons behind every dash in the table, so a missing figure always
// says why (spec §1, "Honest").
function missingNotes(
  payload: Payload,
  ranking: FourPriceRankingFieldsFragment
): string[] {
  const notes: string[] = [];
  for (const { key, label } of METRICS) {
    const tw = payload.byTargetWeight[key];
    const wer = payload.byWeightedEr[key];
    const stat = ranking[key];
    if (tw.multiple == null) notes.push(`${label} TW: ${tw.reason ?? MISSING}`);
    if (wer.multiple == null) {
      notes.push(`${label} WER: ${wer.reason ?? MISSING}`);
    }
    if (tw.multiple != null && stat.percentile == null) {
      notes.push(`${label} rank: ${stat.reason ?? MISSING}`);
    }
  }
  return notes;
}

// Tooltip text for a row: coverage behind each multiple and the universe's
// mean and standard deviation for that metric, one per line.
function rowTooltip(
  tw: FourPriceValueFieldsFragment,
  wer: FourPriceValueFieldsFragment,
  stat: RankStatFieldsFragment,
  universe: string
): string {
  return [
    `TW: ${coverageText(tw)}`,
    `WER: ${coverageText(wer)}`,
    `${universe}: mean ${formatMultiple(stat.universeMean)}, σ ${formatMultiple(stat.universeStdDev)}`,
  ].join('\n');
}

function coverageText(value: FourPriceValueFieldsFragment): string {
  const weight = Math.round(value.coverageWeight * 100);
  return `${value.coveredHoldings} of ${value.totalHoldings} holdings, ${weight}% of weight`;
}
