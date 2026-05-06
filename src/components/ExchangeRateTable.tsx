import { useState } from "react";
import type { ItemWithTrends } from "../types";

interface ExchangeRateTableProps {
  items: ItemWithTrends[];
  baselineItem: ItemWithTrends | null;
  tableTitle: string;
  itemHeading: string;
  emptyTitle: string;
  emptyDescription: string;
  summaryLabel: string;
}

function formatChaos(value: number): string {
  if (value >= 100) {
    return value.toFixed(1);
  }

  if (value >= 10) {
    return value.toFixed(2);
  }

  return value.toFixed(value >= 1 ? 2 : 3);
}

function formatChaosValue(value: number): string {
  return `${formatChaos(value)} Chaos`;
}

function formatWholeChaos(value: number): string {
  return Math.round(value).toString();
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

export function ExchangeRateTable({
  items,
  baselineItem,
  tableTitle,
  itemHeading,
  emptyTitle,
  emptyDescription,
  summaryLabel,
}: ExchangeRateTableProps) {
  const [failedIcons, setFailedIcons] = useState<Record<string, boolean>>({});

  function renderIcon(item: ItemWithTrends, compact = false) {
    const className = compact ? "exchange-icon-fallback" : "item-icon-fallback";

    if (item.icon && !failedIcons[item.id]) {
      return (
        <img
          src={item.icon}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => {
            setFailedIcons((current) => ({ ...current, [item.id]: true }));
          }}
        />
      );
    }

    return <div className={className}>{getItemBadge(item.name)}</div>;
  }

  if (items.length === 0) {
    return (
      <section className="panel table-panel empty-panel">
        <h2>{emptyTitle}</h2>
        <p>{emptyDescription}</p>
        <p className="subtle-copy">Try clearing the search box or switching leagues.</p>
      </section>
    );
  }

  return (
    <section className="panel table-panel">
      <div className="panel-header">
        <div>
          <h2>{tableTitle}</h2>
          <p>{`Showing ${items.length} ${summaryLabel} from the latest snapshot.`}</p>
        </div>
      </div>

      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>{itemHeading}</th>
              <th>Chaos Value</th>
              <th>Exchange Rate</th>
              <th>7-Day</th>
              <th>30-Day</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="item-name-cell">
                    {renderIcon(item)}
                    <div>
                      <strong>{item.name}</strong>
                    </div>
                  </div>
                </td>
                <td>{formatChaosValue(item.chaosValue)}</td>
                <td className="exchange-rate">
                  {baselineItem ? (
                    <div
                      className="exchange-visual"
                      aria-label={`1 ${item.name} equals ${formatWholeChaos(item.chaosValue)} ${baselineItem.name}`}
                    >
                      <span className="exchange-token">
                        <strong>1</strong>
                        {renderIcon(item, true)}
                      </span>
                      <span className="exchange-arrow" aria-hidden="true">
                        =
                      </span>
                      <span className="exchange-token exchange-token-target">
                        {renderIcon(baselineItem, true)}
                        <strong>{formatWholeChaos(item.chaosValue)}</strong>
                      </span>
                    </div>
                  ) : (
                    formatChaosValue(item.chaosValue)
                  )}
                </td>
                <td className={item.change7d === null ? undefined : item.change7d >= 0 ? "positive" : "negative"}>
                  {formatChange(item.change7d)}
                </td>
                <td className={item.change30d === null ? undefined : item.change30d >= 0 ? "positive" : "negative"}>
                  {formatChange(item.change30d)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
