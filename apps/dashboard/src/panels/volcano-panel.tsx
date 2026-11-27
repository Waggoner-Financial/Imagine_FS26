import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { execute } from '../api/client';
import { riskDocument } from '../api/queries';
import { Card } from '../components/card';
import { Stat } from '../components/stat';
import type { RiskQuery } from '../generated/graphql';
import {
  formatCompactPercent,
  formatCorrelation,
  formatPercent,
  formatRiskWindow,
} from '../lib/format';

type Risk = RiskQuery['portfolioRisk'];
type Pair = Risk['topCorrelations'][number];

// VaR and ES rows with one-day and ten-day side by side, so neither is
// hidden behind a hover. All eight figures stay in neutral ink: there is no
// portfolio risk limit to colour them against (spec §3.4, Definitions #13).
function RiskTable({ risk }: { risk: Risk }): ReactNode {
  const rows: [label: string, oneDay: number, tenDay: number][] = [
    ['VaR 95%', risk.var95, risk.var95TenDay],
    ['VaR 99%', risk.var99, risk.var99TenDay],
    ['ES 95%', risk.es95, risk.es95TenDay],
    ['ES 99%', risk.es99, risk.es99TenDay],
  ];

  return (
    <table className="volcano-table">
      <caption className="visually-hidden">
        Value at risk and expected shortfall
      </caption>
      <thead>
        <tr>
          <th scope="col">
            <span className="visually-hidden">Measure</span>
          </th>
          <th scope="col">1-day</th>
          <th scope="col">10-day</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, oneDay, tenDay]) => (
          <tr key={label}>
            <th scope="row">{label}</th>
            <td>{formatPercent(oneDay)}</td>
            <td>{formatPercent(tenDay)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// One list of holding pairs, shown as "SOFI | HOOD 0.65".
function PairList({
  pairs,
  title,
}: {
  pairs: readonly Pair[];
  title: string;
}): ReactNode {
  return (
    <div>
      <h3 className="volcano-pairs-title">{title}</h3>
      <ul className="volcano-pairs-list">
        {pairs.map((pair) => (
          <li key={`${pair.a}|${pair.b}`}>
            <span>
              {pair.a} | {pair.b}
            </span>
            <span>{formatCorrelation(pair.rho)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// VOLcano (spec §3.4): VaR and expected shortfall, GARCH and weighted
// volatility, and the most and least correlated pairs of holdings. The
// caption names the history window, and why it is short when it is.
export function VolcanoPanel({
  portfolioId,
}: {
  portfolioId: string;
}): ReactNode {
  const { data, error, isPending, refetch } = useQuery({
    queryFn: () => execute(riskDocument, { portfolioId }),
    queryKey: ['risk', portfolioId],
  });

  const risk = data?.portfolioRisk;

  return (
    <Card
      title="VOLcano"
      asOf={risk?.asOf}
      error={error}
      isLoading={isPending}
      onRetry={() => {
        void refetch();
      }}
    >
      {risk !== undefined && (
        <>
          <RiskTable risk={risk} />
          <dl className="stats volcano-stats">
            <Stat
              label="GARCH volatility (annualized)"
              value={formatPercent(risk.garchVolAnnualized)}
              note={
                risk.garchVolDaily == null
                  ? risk.garchReason
                  : `${formatPercent(risk.garchVolDaily)} daily`
              }
            />
            <Stat
              label="Weighted volatility (annualized)"
              value={formatPercent(risk.weightedVolAnnualized)}
              note={`Over ${formatCompactPercent(risk.weightedVolCoverage)} of weight`}
            />
          </dl>
          <div className="volcano-pairs">
            <PairList title="Most correlated" pairs={risk.topCorrelations} />
            <PairList
              title="Least correlated"
              pairs={risk.bottomCorrelations}
            />
          </div>
          <p className="volcano-caption">
            Based on{' '}
            {formatRiskWindow(risk.windowDays, risk.requestedWindowDays)} of
            daily returns.{risk.windowNote != null && ` ${risk.windowNote}`}
          </p>
        </>
      )}
    </Card>
  );
}
