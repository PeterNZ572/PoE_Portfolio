import { useState } from "react";
import { formatChaos, formatDivine } from "../lib/format";
import type { ItemWithTrends } from "../types";

interface ItemTableProps {
  items: ItemWithTrends[];
  selectedItemId: string | null;
  onSelectItem: (item: ItemWithTrends) => void;
  onToggleFavorite: (item: ItemWithTrends) => void;
  isFavorite: (item: ItemWithTrends) => boolean;
  totalCount: number;
  isLimited: boolean;
}

function formatDivineValue(value?: number): string {
  if (value === undefined) {
    return "N/A";
  }

  return formatDivine(value);
}

function formatChange(value: number | null): string {
  if (value === null) {
    return "Not enough data";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function getItemBadge(name: string): string {
  const words = name
    .split(/[\s'-]+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (words.length === 0) {
    return "?";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}

export function ItemTable({
  items,
  selectedItemId,
  onSelectItem,
  onToggleFavorite,
  isFavorite,
  totalCount,
  isLimited,
}: ItemTableProps) {
  const [failedIcons, setFailedIcons] = useState<Record<string, boolean>>({});

  if (items.length === 0) {
    return (
      <section className="panel table-panel empty-panel">
        <h2>No Items Found</h2>
        <p>No items match the current filters or search query.</p>
        <p className="subtle-copy">Try clearing your search, adjusting category filters, or sorting by a different metric.</p>
      </section>
    );
  }

  return (
    <section className="panel table-panel">
      <div className="panel-header">
        <h2>Latest Prices</h2>
        <p>
          {isLimited
            ? `Showing the top 10 of ${totalCount} items. Use search to expand the full list.`
            : `Showing ${items.length} items from the current filter set.`}
        </p>
      </div>

      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Favorite</th>
              <th>Item</th>
              <th>Category</th>
              <th>Chaos</th>
              <th>Divine</th>
              <th>7-Day</th>
              <th>30-Day</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const isSelected = selectedItemId === item.id;

              return (
                <tr
                  key={item.id}
                  className={isSelected ? "is-selected" : undefined}
                  onClick={() => onSelectItem(item)}
                >
                  <td>
                    <button
                      type="button"
                      className={isFavorite(item) ? "favorite-button is-favorite" : "favorite-button"}
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggleFavorite(item);
                      }}
                    >
                      {isFavorite(item) ? "Favorited" : "Favorite"}
                    </button>
                  </td>
                  <td>
                    <div className="item-name-cell">
                      {item.icon && !failedIcons[item.id] ? (
                        <img
                          src={item.icon}
                          alt=""
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={() => {
                            setFailedIcons((current) => ({ ...current, [item.id]: true }));
                          }}
                        />
                      ) : (
                        <div className="item-icon-fallback">{getItemBadge(item.name)}</div>
                      )}
                      <div>
                        <strong>{item.name}</strong>
                      </div>
                    </div>
                  </td>
                  <td>{item.category}</td>
                  <td>{formatChaos(item.chaosValue)}</td>
                  <td>{formatDivineValue(item.divineValue)}</td>
                  <td
                    className={
                      item.change7d === null ? undefined : item.change7d >= 0 ? "positive" : "negative"
                    }
                  >
                    {formatChange(item.change7d)}
                  </td>
                  <td
                    className={
                      item.change30d === null ? undefined : item.change30d >= 0 ? "positive" : "negative"
                    }
                  >
                    {formatChange(item.change30d)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
