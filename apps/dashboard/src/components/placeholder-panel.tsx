import type { ReactNode } from 'react';

import type { DashboardHorizon } from '../generated/graphql';
import { horizonLabel } from '../lib/horizons';
import { Card } from './card';

type PlaceholderPanelProps = {
  /** Set for panels that follow the global horizon toggle. */
  horizon?: DashboardHorizon;
  query: string;
  section: string;
  title: string;
};

// Stands in for a panel that has not been built yet, pointing at the part of
// the spec that describes it and the query it will read.
export function PlaceholderPanel({
  horizon,
  query,
  section,
  title,
}: PlaceholderPanelProps): ReactNode {
  return (
    <Card title={title}>
      <div className="placeholder">
        <p>
          Not built yet. It is described in{' '}
          <strong>docs/spec.md {section}</strong> and reads the{' '}
          <code>{query}</code> query.
        </p>
        {horizon !== undefined && (
          <p>
            It follows the global horizon, currently{' '}
            <strong>{horizonLabel(horizon)}</strong>.
          </p>
        )}
      </div>
    </Card>
  );
}
