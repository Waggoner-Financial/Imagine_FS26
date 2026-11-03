import { type ReactNode, useState } from 'react';

import { formatSignedPercent } from '../lib/format';
import {
  biggestMove,
  layoutTiles,
  type PlacedTile,
  type Tile,
  tileColor,
} from '../lib/treemap';
import { useElementWidth } from '../lib/use-element-width';

const HEIGHT = 320;

export function TreemapChart({
  onZoom,
  tiles,
}: {
  onZoom: (id: string) => void;
  tiles: readonly Tile[];
}): ReactNode {
  const [containerRef, width] = useElementWidth<HTMLDivElement>();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const maxMove = biggestMove(tiles);
  const hovered = tiles.find((tile) => tile.id === hoveredId);

  return (
    <>
      <div ref={containerRef} className="treemap" style={{ height: HEIGHT }}>
        {layoutTiles(tiles, width, HEIGHT).map((tile) => (
          <TreemapTile
            key={tile.id}
            color={tileColor(tile, maxMove)}
            tile={tile}
            onHover={setHoveredId}
            onZoom={onZoom}
          />
        ))}
      </div>

      <p className="treemap-detail" aria-live="polite">
        {hovered === undefined ? (
          <span className="treemap-detail-hint">
            Hover or focus a tile for details.
          </span>
        ) : (
          <>
            <span className="treemap-detail-title">{hovered.title}</span>
            {hovered.details.map(([label, value]) => (
              <span key={label} className="treemap-detail-item">
                <span className="treemap-detail-label">{label}</span>
                <span className="treemap-detail-value">{value}</span>
              </span>
            ))}
          </>
        )}
      </p>
    </>
  );
}

function TreemapTile({
  color,
  onHover,
  onZoom,
  tile,
}: {
  color: string;
  onHover: (id: string | null) => void;
  onZoom: (id: string) => void;
  tile: PlacedTile;
}): ReactNode {
  const summary = tile.details.map(([label, value]) => `${label} ${value}`);
  const props = {
    'aria-label': `${tile.title}: ${summary.join(', ')}`,
    className: 'treemap-tile',
    onBlur: () => onHover(null),
    onFocus: () => onHover(tile.id),
    onMouseEnter: () => onHover(tile.id),
    onMouseLeave: () => onHover(null),
    style: {
      background: color,
      height: tile.y1 - tile.y0,
      left: tile.x0,
      top: tile.y0,
      width: tile.x1 - tile.x0,
    },
  };

  const label = (
    <>
      <span className="treemap-name">{tile.label}</span>
      <span className="treemap-return">{formatSignedPercent(tile.return)}</span>
    </>
  );
  if (tile.href !== undefined) {
    return (
      <a {...props} href={tile.href}>
        {label}
      </a>
    );
  }
  if (tile.isCash) {
    return (
      <div {...props} role="img">
        {label}
      </div>
    );
  }
  return (
    <button type="button" {...props} onClick={() => onZoom(tile.id)}>
      {label}
    </button>
  );
}
