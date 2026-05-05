import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { AboutProject } from "./components/AboutProject";
import { Filters } from "./components/Filters";
import { Header } from "./components/Header";
import { ItemTable } from "./components/ItemTable";
import { StatCards } from "./components/StatCards";
import { loadDashboardData } from "./lib/data";
import { getBiggestMovers, sortItems } from "./lib/trends";
import type {
  AnalysisTab,
  CompareMetric,
  DashboardData,
  ItemCategory,
  ItemWithTrends,
  LeagueKey,
  SortOption,
} from "./types";

const DEFAULT_LEAGUE: LeagueKey = "Mirage";
const FAVORITES_STORAGE_KEY = "poe-dashboard-favorites";
const TrendChart = lazy(() => import("./components/TrendChart"));
const CompareChart = lazy(() =>
  import("./components/CompareChart").then((module) => ({ default: module.CompareChart })),
);
const DEFAULT_COMPARE_METRIC: CompareMetric = "chaosValue";

function filterItems(
  items: ItemWithTrends[],
  search: string,
  category: ItemCategory | "All",
  sortBy: SortOption,
): ItemWithTrends[] {
  const normalizedSearch = search.trim().toLowerCase();

  const filtered = items.filter((item) => {
    const matchesSearch =
      normalizedSearch.length === 0 || item.name.toLowerCase().includes(normalizedSearch);
    const matchesCategory = category === "All" || item.category === category;
    return matchesSearch && matchesCategory;
  });

  return sortItems(filtered, sortBy);
}

function loadFavoriteKeys(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored) as unknown;
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}

function buildFavoriteKey(league: LeagueKey, itemId: string): string {
  return `${league}:${itemId}`;
}

function prioritizeFavorites(
  items: ItemWithTrends[],
  league: LeagueKey,
  favoriteKeys: Set<string>,
): ItemWithTrends[] {
  return [...items].sort((left, right) => {
    const leftFavorite = favoriteKeys.has(buildFavoriteKey(league, left.id));
    const rightFavorite = favoriteKeys.has(buildFavoriteKey(league, right.id));

    if (leftFavorite === rightFavorite) {
      return 0;
    }

    return leftFavorite ? -1 : 1;
  });
}

export default function App() {
  const [league, setLeague] = useState<LeagueKey>(DEFAULT_LEAGUE);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ItemCategory | "All">("All");
  const [sortBy, setSortBy] = useState<SortOption>("price");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [favoriteKeys, setFavoriteKeys] = useState<string[]>([]);
  const [analysisTab, setAnalysisTab] = useState<AnalysisTab>("single");
  const [compareMetric, setCompareMetric] = useState<CompareMetric>(DEFAULT_COMPARE_METRIC);
  const [compareItemIds, setCompareItemIds] = useState<string[]>([]);

  useEffect(() => {
    setFavoriteKeys(loadFavoriteKeys());
  }, []);

  useEffect(() => {
    let active = true;

    async function run() {
      try {
        setLoading(true);
        setError(null);
        setCategory("All");
        setSearch("");
        setSortBy("price");
        const dashboardData = await loadDashboardData(league);

        if (!active) {
          return;
        }

        setData(dashboardData);
        setSelectedItemId(dashboardData.items[0]?.id ?? null);
      } catch (caughtError) {
        if (!active) {
          return;
        }

        const message = caughtError instanceof Error ? caughtError.message : "Unknown error";
        setError(message);
        setData(null);
        setSelectedItemId(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void run();

    return () => {
      active = false;
    };
  }, [league]);

  const filteredItems = useMemo(() => {
    return filterItems(data?.items ?? [], search, category, sortBy);
  }, [category, data?.items, search, sortBy]);

  const favoriteKeySet = useMemo(() => new Set(favoriteKeys), [favoriteKeys]);
  const orderedItems = useMemo(
    () => prioritizeFavorites(filteredItems, league, favoriteKeySet),
    [favoriteKeySet, filteredItems, league],
  );
  const isSearchActive = search.trim().length > 0;
  const displayedItems = useMemo(() => {
    return isSearchActive ? orderedItems : orderedItems.slice(0, 10);
  }, [isSearchActive, orderedItems]);
  const isListLimited = !isSearchActive && orderedItems.length > displayedItems.length;

  useEffect(() => {
    if (filteredItems.length === 0) {
      setSelectedItemId(null);
      return;
    }

    const selectedStillVisible = filteredItems.some((item) => item.id === selectedItemId);
    if (!selectedStillVisible) {
      setSelectedItemId(displayedItems[0]?.id ?? filteredItems[0].id);
    }
  }, [displayedItems, filteredItems, selectedItemId]);

  useEffect(() => {
    const availableIds = new Set((data?.items ?? []).map((item) => item.id));
    setCompareItemIds((current) => current.filter((itemId) => availableIds.has(itemId)));
  }, [data?.items]);

  const selectedItem = filteredItems.find((item) => item.id === selectedItemId) ?? null;
  const movers = useMemo(() => getBiggestMovers(filteredItems), [filteredItems]);
  const compareItems = useMemo(() => {
    const order = new Map((data?.items ?? []).map((item, index) => [item.id, { item, index }]));

    return compareItemIds
      .map((itemId) => order.get(itemId))
      .filter((entry): entry is { item: ItemWithTrends; index: number } => Boolean(entry))
      .sort((left, right) => left.index - right.index)
      .map((entry) => entry.item);
  }, [compareItemIds, data?.items]);
  const compareCandidates = useMemo(() => {
    return isSearchActive ? orderedItems.slice(0, 60) : orderedItems.slice(0, 24);
  }, [isSearchActive, orderedItems]);

  function isFavorite(item: ItemWithTrends): boolean {
    return favoriteKeySet.has(buildFavoriteKey(league, item.id));
  }

  function toggleFavorite(item: ItemWithTrends): void {
    setFavoriteKeys((current) => {
      const key = buildFavoriteKey(league, item.id);
      const next = current.includes(key)
        ? current.filter((entry) => entry !== key)
        : [...current, key];
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function toggleCompareItem(item: ItemWithTrends): void {
    setCompareItemIds((current) => {
      if (current.includes(item.id)) {
        return current.filter((itemId) => itemId !== item.id);
      }

      return [...current, item.id].slice(0, 6);
    });
  }

  return (
    <div className="app-shell">
      <div className="background-orb background-orb-left" />
      <div className="background-orb background-orb-right" />

      <main className="layout">
        <Header league={league} onLeagueChange={setLeague} latestDate={data?.latestDate ?? null} />

        {loading ? (
          <section className="panel state-panel">
            <h2>Loading dashboard</h2>
            <p>Reading static snapshot manifests and league history from the local data directory.</p>
          </section>
        ) : null}

        {error ? (
          <section className="panel state-panel error-panel">
            <h2>Unable to load league data</h2>
            <p>{error}</p>
          </section>
        ) : null}

        {!loading && !error && data ? (
          <>
            <StatCards items={filteredItems} latestDate={data.latestDate} />

            <section className="movers-grid">
              <article className="panel movers-panel">
                <div className="panel-header">
                  <h2>Biggest Gainers</h2>
                  <p>Ranked by 7-day percentage change for the current filter set.</p>
                </div>
                <div className="mover-list">
                  {movers.gainers.length > 0 ? (
                    movers.gainers.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="mover-card"
                        onClick={() => setSelectedItemId(item.id)}
                      >
                        <span>{item.name}</span>
                        <strong>{item.change7d !== null ? `+${item.change7d.toFixed(1)}%` : "N/A"}</strong>
                      </button>
                    ))
                  ) : (
                    <p className="subtle-copy">Not enough history for gainers yet.</p>
                  )}
                </div>
              </article>

              <article className="panel movers-panel">
                <div className="panel-header">
                  <h2>Biggest Losers</h2>
                  <p>Weakest 7-day moves based on saved daily snapshot history.</p>
                </div>
                <div className="mover-list">
                  {movers.losers.length > 0 ? (
                    movers.losers.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="mover-card mover-card-loss"
                        onClick={() => setSelectedItemId(item.id)}
                      >
                        <span>{item.name}</span>
                        <strong>{item.change7d !== null ? `${item.change7d.toFixed(1)}%` : "N/A"}</strong>
                      </button>
                    ))
                  ) : (
                    <p className="subtle-copy">Not enough history for losers yet.</p>
                  )}
                </div>
              </article>
            </section>

            <Filters
              search={search}
              category={category}
              categories={data.categories}
              sortBy={sortBy}
              onSearchChange={setSearch}
              onCategoryChange={setCategory}
              onSortChange={setSortBy}
            />

            <section className="analysis-tabs" aria-label="Analysis views">
              <button
                type="button"
                className={analysisTab === "single" ? "analysis-tab is-active" : "analysis-tab"}
                onClick={() => setAnalysisTab("single")}
              >
                Single item
              </button>
              <button
                type="button"
                className={analysisTab === "compare" ? "analysis-tab is-active" : "analysis-tab"}
                onClick={() => setAnalysisTab("compare")}
              >
                Compare items
              </button>
            </section>

            {analysisTab === "single" ? (
              <section className="content-grid">
                <ItemTable
                  items={displayedItems}
                  selectedItemId={selectedItemId}
                  onSelectItem={(item) => setSelectedItemId(item.id)}
                  onToggleFavorite={toggleFavorite}
                  isFavorite={isFavorite}
                  totalCount={orderedItems.length}
                  isLimited={isListLimited}
                />
                <Suspense
                  fallback={
                    <section className="panel chart-panel state-panel">
                      <h2>Loading chart</h2>
                      <p>Preparing the trend visualization bundle.</p>
                    </section>
                  }
                >
                  <TrendChart item={selectedItem} />
                </Suspense>
              </section>
            ) : (
              <section className="compare-grid">
                <section className="panel compare-picker-panel">
                  <div className="panel-header">
                    <h2>Compare Selection</h2>
                    <p>Select up to 6 items from the current filtered set.</p>
                  </div>

                  <div className="selected-compare-items">
                    {compareItems.length > 0 ? (
                      compareItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="compare-chip is-selected"
                          onClick={() => toggleCompareItem(item)}
                        >
                          <span>{item.name}</span>
                          <strong>Remove</strong>
                        </button>
                      ))
                    ) : (
                      <p className="subtle-copy">No items selected yet.</p>
                    )}
                  </div>

                  <div className="compare-candidate-list">
                    {compareCandidates.map((item) => {
                      const selected = compareItemIds.includes(item.id);

                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={selected ? "compare-chip is-selected" : "compare-chip"}
                          onClick={() => toggleCompareItem(item)}
                        >
                          <span>{item.name}</span>
                          <strong>{selected ? "Selected" : "Add"}</strong>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <Suspense
                  fallback={
                    <section className="panel compare-chart-panel state-panel">
                      <h2>Loading comparison chart</h2>
                      <p>Preparing the multi-item trend view.</p>
                    </section>
                  }
                >
                  <CompareChart
                    items={compareItems}
                    metric={compareMetric}
                    onMetricChange={setCompareMetric}
                  />
                </Suspense>
              </section>
            )}

            <AboutProject />
          </>
        ) : null}
      </main>
    </div>
  );
}
