import { buildDashboardData } from "./trends";
import type {
  DashboardData,
  LeagueIndexFile,
  LeagueKey,
  RootDataIndex,
  SnapshotFile,
} from "../types";

const rootIndexCache: { current: RootDataIndex | null } = { current: null };
const leagueIndexCache = new Map<LeagueKey, LeagueIndexFile>();
const snapshotsCache = new Map<LeagueKey, SnapshotFile[]>();

interface LoadOptions {
  bypassCache?: boolean;
}

function compareSnapshotKeys(left: string, right: string): number {
  const leftTime = Date.parse(left);
  const rightTime = Date.parse(right);

  if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) {
    return leftTime - rightTime;
  }

  return left.localeCompare(right);
}

function resolvePublicPath(path: string): string {
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL.slice(0, -1)
    : import.meta.env.BASE_URL;

  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

async function fetchJson<T>(path: string, options?: LoadOptions): Promise<T> {
  const url = resolvePublicPath(path);
  const requestUrl = options?.bypassCache ? `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}` : url;
  const response = await fetch(requestUrl, {
    cache: options?.bypassCache ? "no-store" : "default",
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${path}: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

export async function loadRootIndex(options?: LoadOptions): Promise<RootDataIndex> {
  if (options?.bypassCache) {
    return fetchJson<RootDataIndex>("/data/index.json", options);
  }

  if (!rootIndexCache.current) {
    rootIndexCache.current = await fetchJson<RootDataIndex>("/data/index.json", options);
  }

  return rootIndexCache.current;
}

export async function loadLeagueIndex(league: LeagueKey, options?: LoadOptions): Promise<LeagueIndexFile> {
  if (options?.bypassCache) {
    const rootIndex = await loadRootIndex(options);
    const entry = rootIndex.leagues.find((candidate) => candidate.key === league);

    if (!entry) {
      throw new Error(`League "${league}" is not configured in /data/index.json`);
    }

    return fetchJson<LeagueIndexFile>(entry.indexPath, options);
  }

  const cached = leagueIndexCache.get(league);
  if (cached) {
    return cached;
  }

  const rootIndex = await loadRootIndex(options);
  const entry = rootIndex.leagues.find((candidate) => candidate.key === league);

  if (!entry) {
    throw new Error(`League "${league}" is not configured in /data/index.json`);
  }

  const leagueIndex = await fetchJson<LeagueIndexFile>(entry.indexPath, options);
  leagueIndexCache.set(league, leagueIndex);
  return leagueIndex;
}

export async function loadLeagueSnapshots(league: LeagueKey, options?: LoadOptions): Promise<SnapshotFile[]> {
  if (options?.bypassCache) {
    const leagueIndex = await loadLeagueIndex(league, options);
    const dates = [...leagueIndex.dates].sort((left, right) => compareSnapshotKeys(left, right));

    return Promise.all(
      dates.map((date) => fetchJson<SnapshotFile>(leagueIndex.snapshotPaths[date], options)),
    );
  }

  const cached = snapshotsCache.get(league);
  if (cached) {
    return cached;
  }

  const leagueIndex = await loadLeagueIndex(league, options);
  const dates = [...leagueIndex.dates].sort((left, right) => compareSnapshotKeys(left, right));

  const snapshots = await Promise.all(
    dates.map((date) => fetchJson<SnapshotFile>(leagueIndex.snapshotPaths[date], options)),
  );

  snapshotsCache.set(league, snapshots);
  return snapshots;
}

export async function loadDashboardData(league: LeagueKey, options?: LoadOptions): Promise<DashboardData> {
  const snapshots = await loadLeagueSnapshots(league, options);
  return buildDashboardData(league, snapshots);
}

export function resetDataCaches(): void {
  rootIndexCache.current = null;
  leagueIndexCache.clear();
  snapshotsCache.clear();
}
