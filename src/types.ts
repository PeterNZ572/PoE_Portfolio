export const LEAGUE_OPTIONS = [
  { key: "Mirage", label: "Mirage", slug: "mirage" },
  { key: "Hardcore Mirage", label: "Hardcore Mirage", slug: "hardcore-mirage" },
  { key: "Standard", label: "Standard", slug: "standard" },
  { key: "Hardcore Standard", label: "Hardcore Standard", slug: "hardcore-standard" },
] as const;

export type LeagueKey = (typeof LEAGUE_OPTIONS)[number]["key"];
export type LeagueSlug = (typeof LEAGUE_OPTIONS)[number]["slug"];

export type ItemCategory =
  | "Currency"
  | "Scarab"
  | "UniqueWeapon"
  | "UniqueArmour"
  | "DivinationCard"
  | "SkillGem";

export type SortOption = "name" | "price" | "change7d" | "change30d";
export type AnalysisTab = "single" | "compare";
export type ViewTab = "market" | "currency" | "scarab";
export type CompareMetric = "chaosValue" | "divineValue";

export interface NormalizedItem {
  id: string;
  name: string;
  category: ItemCategory;
  chaosValue: number;
  divineValue?: number;
  icon?: string;
  date: string;
  league: LeagueKey;
}

export interface SnapshotFile {
  date: string;
  league: LeagueKey;
  items: NormalizedItem[];
}

export interface LeagueDirectoryEntry {
  key: LeagueKey;
  label: LeagueKey;
  slug: LeagueSlug;
  indexPath: string;
}

export interface RootDataIndex {
  generatedAt: string;
  defaultLeague: LeagueKey;
  leagues: LeagueDirectoryEntry[];
}

export interface LeagueIndexFile {
  league: LeagueKey;
  slug: LeagueSlug;
  generatedAt: string;
  latest: string | null;
  dates: string[];
  snapshotPaths: Record<string, string>;
}

export interface TrendPoint {
  date: string;
  chaosValue: number;
  divineValue?: number;
}

export interface ItemTrendMetrics {
  previousPrice: number | null;
  previousDate: string | null;
  change7d: number | null;
  change30d: number | null;
}

export interface ItemWithTrends extends NormalizedItem, ItemTrendMetrics {
  trend: TrendPoint[];
}

export interface DashboardData {
  league: LeagueKey;
  latestDate: string | null;
  categories: ItemCategory[];
  items: ItemWithTrends[];
}
