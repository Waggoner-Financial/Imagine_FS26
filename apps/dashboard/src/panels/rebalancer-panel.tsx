import { useQuery } from '@tanstack/react-query';
import { type ReactNode, useId, useState } from 'react';

import { execute } from '../api/client';
import { expectedReturnDocument } from '../api/queries';
import { Card } from '../components/card';
import type { ExpectedReturnQuery } from '../generated/graphql';
import {
  formatCompactPercent,
  formatDate,
  formatPercent,
  formatPercentagePoints,
  formatPrice,
  formatSignedCompactPercent,
  formatSignedPercent,
} from '../lib/format';

type Contributor =
  ExpectedReturnQuery['portfolioExpectedReturn']['topContributors'][number];

type ContributorRowsProps = {
  contributors: readonly Contributor[];
  staleTickers: ReadonlySet<string>;
};

function signClass(value: number): string {
  if (value > 0) return 'figure-up';
  if (value < 0) return 'figure-down';
  return '';
}

function ContributorRows({
  contributors,
  staleTickers,
}: ContributorRowsProps): ReactNode {
  if (contributors.length === 0) {
    return (
      <tr>
        <td className="rebalancer-empty" colSpan={4}>
          No contributors available.
        </td>
      </tr>
    );
  }

  return contributors.map((contributor) => (
    <tr key={contributor.ticker}>
      <th scope="row">
        <span className="contributor-identity">
          <span className="ticker-badge">{contributor.ticker}</span>
          {staleTickers.has(contributor.ticker) && (
            <span
              className="stale-target-icon"
              role="img"
              aria-label="Stale price target"
              title="Stale price target"
            >
              ⚠
            </span>
          )}
        </span>
        <span className="contributor-prices">
          {formatPrice(contributor.price)} →{' '}
          {formatPrice(contributor.priceTarget)}
        </span>
      </th>
      <td>{formatCompactPercent(contributor.targetWeight)}</td>
      <td className={signClass(contributor.er)}>
        {formatSignedCompactPercent(contributor.er)}
      </td>
      <td className="contribution-pp">
        {formatPercentagePoints(contributor.contribution)}
      </td>
    </tr>
  ));
}

function ContributorsTable({
  bottomContributors,
  staleTickers,
  topContributors,
}: {
  bottomContributors: readonly Contributor[];
  staleTickers: ReadonlySet<string>;
  topContributors: readonly Contributor[];
}): ReactNode {
  return (
    <table className="rebalancer-table">
      <caption className="visually-hidden">
        Expected return contributors
      </caption>
      <thead>
        <tr>
          <th scope="col">Contributor</th>
          <th scope="col">
            <abbr title="Target weight">TW</abbr>
          </th>
          <th scope="col">
            <abbr title="Expected return">ER</abbr>
          </th>
          <th scope="col">
            <abbr title="Target weight times expected return, in percentage points">
              TW×ER (pp)
            </abbr>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr className="contributor-group">
          <th colSpan={4} scope="rowgroup">
            Top contributors
          </th>
        </tr>
        <ContributorRows
          contributors={topContributors}
          staleTickers={staleTickers}
        />
        <tr className="contributor-group">
          <th colSpan={4} scope="rowgroup">
            Bottom contributors
          </th>
        </tr>
        <ContributorRows
          contributors={bottomContributors}
          staleTickers={staleTickers}
        />
      </tbody>
    </table>
  );
}

// Rebalancer (spec §3.6): expected return implied by price targets,
// contribution leaders, and stale or missing targets.
export function RebalancerPanel({
  portfolioId,
}: {
  portfolioId: string;
}): ReactNode {
  const [showStaleTargets, setShowStaleTargets] = useState(false);
  const staleTargetsId = useId();
  const { data, error, isPending, refetch } = useQuery({
    queryFn: () => execute(expectedReturnDocument, { portfolioId }),
    queryKey: ['expected-return', portfolioId],
  });

  const expectedReturn = data?.portfolioExpectedReturn;
  const staleTargets = expectedReturn?.stalePriceTargets;
  const staleTickers = new Set(
    staleTargets?.tickers.map((target) => target.ticker) ?? []
  );

  return (
    <Card
      title="Rebalancer"
      asOf={expectedReturn?.asOf}
      error={error}
      isLoading={isPending}
      onRetry={() => {
        void refetch();
      }}
      actions={
        staleTargets !== undefined && staleTargets.count > 0 ? (
          <button
            type="button"
            className="warning-badge"
            aria-controls={staleTargetsId}
            aria-expanded={showStaleTargets}
            onClick={() => {
              setShowStaleTargets((current) => !current);
            }}
          >
            <span aria-hidden="true">⚠</span> {staleTargets.count}{' '}
            {staleTargets.count === 1 ? 'stale target' : 'stale targets'}
          </button>
        ) : undefined
      }
    >
      {expectedReturn !== undefined && (
        <div className="rebalancer">
          <dl className="rebalancer-summary">
            <div className="rebalancer-headline">
              <dt>Expected return</dt>
              <dd className={signClass(expectedReturn.portfolioEr)}>
                {formatSignedPercent(expectedReturn.portfolioEr)}
              </dd>
            </div>
            <div className="rebalancer-coverage">
              <dt className="visually-hidden">
                Expected return calculation coverage
              </dt>
              <dd>
                Covers {formatPercent(expectedReturn.coveredWeight)} of target
                weight
              </dd>
            </div>
          </dl>

          <ContributorsTable
            topContributors={expectedReturn.topContributors}
            bottomContributors={expectedReturn.bottomContributors}
            staleTickers={staleTickers}
          />
          {showStaleTargets &&
            staleTargets !== undefined &&
            staleTargets.count > 0 && (
              <section
                id={staleTargetsId}
                className="rebalancer-notice warning-notice"
              >
                <h3>Stale price targets</h3>
                <ul>
                  {staleTargets.tickers.map((target) => (
                    <li key={target.ticker}>
                      <strong>{target.ticker}</strong>: target set{' '}
                      {formatDate(target.priceTargetDate)}; earnings reported{' '}
                      {formatDate(target.lastEarningsDate)}
                    </li>
                  ))}
                </ul>
              </section>
            )}

          {expectedReturn.noTarget.length > 0 && (
            <section className="rebalancer-notice">
              <h3>No price target</h3>
              <p>{expectedReturn.noTarget.join(', ')}</p>
            </section>
          )}
        </div>
      )}
    </Card>
  );
}
