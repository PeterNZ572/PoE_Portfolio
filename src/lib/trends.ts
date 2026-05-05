import type {
  DashboardData,
  ItemTrendMetrics,
  ItemWithTrends,
  LeagueKey,
  NormalizedItem,
  SnapshotFile,
  TrendPoint,
} from "../types";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function snapshotTime(value: string): number {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : Number.NaN;
}

function sortSnapshots(snapshots: SnapshotFile[]): SnapshotFile[] {
  return [...snapshots].sort((left, right) => {
    const leftTime = snapshotTime(left.date);
    const rightTime = snapshotTime(right.date);

    if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) {
      return leftTime - rightTime;
    }

    return left.date.localeCompare(right.date);
  });
}

function dedupeSnapshot(snapshot: SnapshotFile): SnapshotFile {
  const deduped = new Map<string, NormalizedItem>();

  for (const item of snapshot.items) {
    const key = `${item.category}::${item.name}`;
    const current = deduped.get(key);

    if (
      !current ||
      item.chaosValue > current.chaosValue ||
      (item.chaosValue === current.chaosValue && (item.divineValue ?? 0) > (current.divineValue ?? 0))
    ) {
      deduped.set(key, item);
    }
  }

  return {
    ...snapshot,
    items: Array.from(deduped.values()),
  };
}

function findLatestSnapshot(snapshots: SnapshotFile[]): SnapshotFile | null {
  const ordered = sortSnapshots(snapshots);
  return ordered.length > 0 ? ordered[ordered.length - 1] : null;
}

function findSnapshotAtOrBefore(snapshots: SnapshotFile[], targetTime: number): SnapshotFile | null {
  const ordered = sortSnapshots(snapshots);

  for (let index = ordered.length - 1; index >= 0; index -= 1) {
    if (snapshotTime(ordered[index].date) <= targetTime) {
      return ordered[index];
    }
  }

  return null;
}

function calculatePercentChange(current: number, previous: number | null): number | null {
  if (previous === null || previous <= 0) {
    return null;
  }

  return ((current - previous) / previous) * 100;
}

function buildTrendSeries(history: SnapshotFile[], itemId: string): TrendPoint[] {
  return sortSnapshots(history)
    .map((snapshot) => snapshot.items.find((item) => item.id === itemId))
    .filter((item): item is NormalizedItem => Boolean(item))
    .map((item) => ({
      date: item.date,
      chaosValue: item.chaosValue,
      divineValue: item.divineValue,
    }));
}

function buildTrendMetrics(history: SnapshotFile[], item: NormalizedItem): ItemTrendMetrics {
  const ordered = sortSnapshots(history);
  const latestIndex = ordered.findIndex((snapshot) => snapshot.date === item.date);
  const previousSnapshot = latestIndex > 0 ? ordered[latestIndex - 1] : null;
  const previousPrice =
    previousSnapshot?.items.find((entry) => entry.id === item.id)?.chaosValue ?? null;

  const latestTime = snapshotTime(item.date);
  const sevenDaySnapshot = findSnapshotAtOrBefore(history, latestTime - 7 * DAY_IN_MS);
  const thirtyDaySnapshot = findSnapshotAtOrBefore(history, latestTime - 30 * DAY_IN_MS);

  const sevenDayPrice =
    sevenDaySnapshot?.items.find((entry) => entry.id === item.id)?.chaosValue ?? null;
  const thirtyDayPrice =
    thirtyDaySnapshot?.items.find((entry) => entry.id === item.id)?.chaosValue ?? null;

  return {
    previousPrice,
    previousDate: previousSnapshot?.date ?? null,
    change7d: calculatePercentChange(item.chaosValue, sevenDayPrice),
    change30d: calculatePercentChange(item.chaosValue, thirtyDayPrice),
  };
}

export function buildDashboardData(league: LeagueKey, snapshots: SnapshotFile[]): DashboardData {
  const normalizedSnapshots = sortSnapshots(snapshots).map(dedupeSnapshot);
  const latest = findLatestSnapshot(normalizedSnapshots);

  if (!latest) {
    return {
      league,
      latestDate: null,
      categories: [],
      items: [],
    };
  }

  const items: ItemWithTrends[] = latest.items.map((item) => ({
    ...item,
    ...buildTrendMetrics(normalizedSnapshots, item),
    trend: buildTrendSeries(normalizedSnapshots, item.id),
  }));

  const categories = Array.from(new Set(items.map((item) => item.category))).sort();

  return {
    league,
    latestDate: latest.date,
    categories,
    items,
  };
}

export function sortItems(items: ItemWithTrends[], sortBy: string): ItemWithTrends[] {
  const collator = new Intl.Collator(undefined, { sensitivity: "base" });

  return [...items].sort((left, right) => {
    if (sortBy === "name") {
      return collator.compare(left.name, right.name);
    }

    if (sortBy === "price") {
      return right.chaosValue - left.chaosValue;
    }

    if (sortBy === "change7d") {
      return (right.change7d ?? Number.NEGATIVE_INFINITY) - (left.change7d ?? Number.NEGATIVE_INFINITY);
    }

    if (sortBy === "change30d") {
      return (
        (right.change30d ?? Number.NEGATIVE_INFINITY) -
        (left.change30d ?? Number.NEGATIVE_INFINITY)
      );
    }

    return 0;
  });
}

export function getBiggestMovers(items: ItemWithTrends[]): {
  gainers: ItemWithTrends[];
  losers: ItemWithTrends[];
} {
  const ranked = items.filter((item) => item.change7d !== null);
  const byGain = [...ranked].sort((left, right) => (right.change7d ?? 0) - (left.change7d ?? 0));
  const byLoss = [...ranked].sort((left, right) => (left.change7d ?? 0) - (right.change7d ?? 0));

  return {
    gainers: byGain.slice(0, 3),
    losers: byLoss.slice(0, 3),
  };
}

export function averagePrice(items: ItemWithTrends[]): number {
  if (items.length === 0) {
    return 0;
  }

  const total = items.reduce((sum, item) => sum + item.chaosValue, 0);
  return total / items.length;
}
