import { averagePrice, getBiggestMovers } from "../lib/trends";
import type { ItemWithTrends } from "../types";

interface StatCardsProps {
  items: ItemWithTrends[];
  latestDate: string | null;
}

const snapshotDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

const snapshotDayFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
});

function formatChaos(value: number): string {
  return `${value.toFixed(value >= 10 ? 1 : 2)}c`;
}

function formatChange(value: number | null): string {
  if (value === null) {
    return "Not enough data";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function formatLatestSnapshot(value: string | null): string {
  if (!value) {
    return "Unavailable";
  }

  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return value;
  }

  return value.includes("T")
    ? snapshotDateFormatter.format(new Date(parsed))
    : snapshotDayFormatter.format(new Date(parsed));
}

export function StatCards({ items, latestDate }: StatCardsProps) {
  const { gainers } = getBiggestMovers(items);
  const topMover = gainers[0];
  const avgPrice = averagePrice(items);
  const latestSnapshot = formatLatestSnapshot(latestDate);

  return (
    <section className="stats-grid">
      <article className="panel stat-card">
        <span className="muted-label">Tracked Items</span>
        <strong className="stat-card-value">{items.length.toLocaleString()}</strong>
        <p className="stat-card-copy">Visible rows in the current league and filter set.</p>
      </article>

      <article className="panel stat-card">
        <span className="muted-label">Average Price</span>
        <strong className="stat-card-value">{formatChaos(avgPrice)}</strong>
        <p className="stat-card-copy">Mean chaos value across the current item selection.</p>
      </article>

      <article className="panel stat-card">
        <span className="muted-label">Strongest 7D Move</span>
        <strong className="stat-card-value stat-card-value-title">
          {topMover ? topMover.name : "No data"}
        </strong>
        <p className="stat-card-copy">
          {topMover ? formatChange(topMover.change7d) : "Waiting for more history."}
        </p>
      </article>

      <article className="panel stat-card">
        <span className="muted-label">Latest Snapshot</span>
        <strong className="stat-card-value stat-card-value-date">{latestSnapshot}</strong>
        <p className="stat-card-copy">Static JSON snapshot stored under the selected league.</p>
      </article>
    </section>
  );
}
