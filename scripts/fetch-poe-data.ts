import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type LeagueKey = "Mirage" | "Hardcore Mirage" | "Standard" | "Hardcore Standard";
type LeagueSlug = "mirage" | "hardcore-mirage" | "standard" | "hardcore-standard";
type ItemCategory =
  | "Currency"
  | "Scarab"
  | "UniqueWeapon"
  | "UniqueArmour"
  | "DivinationCard"
  | "SkillGem";

interface NormalizedItem {
  id: string;
  name: string;
  category: ItemCategory;
  chaosValue: number;
  divineValue?: number;
  icon?: string;
  date: string;
  league: LeagueKey;
}

interface SnapshotFile {
  date: string;
  league: LeagueKey;
  items: NormalizedItem[];
}

interface LeagueIndexFile {
  league: LeagueKey;
  slug: LeagueSlug;
  generatedAt: string;
  latest: string | null;
  dates: string[];
  snapshotPaths: Record<string, string>;
}

interface RootIndexFile {
  generatedAt: string;
  defaultLeague: LeagueKey;
  leagues: Array<{
    key: LeagueKey;
    label: LeagueKey;
    slug: LeagueSlug;
    indexPath: string;
  }>;
}

interface CurrencyOverviewResponse {
  items?: CurrencyMetadata[];
  lines?: CurrencyLine[];
  core?: {
    items?: CurrencyMetadata[];
  };
}

interface ExchangeItemOverviewResponse {
  items?: ExchangeItemMetadata[];
  lines?: CurrencyLine[];
}

interface ItemOverviewResponse {
  lines?: ItemLine[];
}

interface CurrencyMetadata {
  id?: string;
  name?: string;
  image?: string;
}

interface ExchangeItemMetadata {
  id?: string;
  name?: string;
  image?: string;
}

interface CurrencyLine {
  id?: string;
  primaryValue?: number;
}

interface ItemLine {
  name?: string;
  chaosValue?: number;
  icon?: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const publicDataDir = path.join(repoRoot, "public", "data");
const publicIconsDir = path.join(repoRoot, "public", "icons", "currency");
const snapshotTimestamp = new Date().toISOString();
const snapshotFileStamp = snapshotTimestamp.replace(/[:.]/g, "-");

const LEAGUES: Array<{
  key: LeagueKey;
  label: LeagueKey;
  slug: LeagueSlug;
  apiLeague: string;
}> = [
  { key: "Mirage", label: "Mirage", slug: "mirage", apiLeague: "Mirage" },
  {
    key: "Hardcore Mirage",
    label: "Hardcore Mirage",
    slug: "hardcore-mirage",
    apiLeague: "Hardcore Mirage",
  },
  { key: "Standard", label: "Standard", slug: "standard", apiLeague: "Standard" },
  {
    key: "Hardcore Standard",
    label: "Hardcore Standard",
    slug: "hardcore-standard",
    apiLeague: "Hardcore",
  },
];

const ENDPOINTS: Array<{ category: ItemCategory; url: (league: string) => string }> = [
  {
    category: "Currency",
    url: (league) =>
      `https://poe.ninja/poe1/api/economy/exchange/current/overview?league=${encodeURIComponent(league)}&type=Currency`,
  },
  {
    category: "Scarab",
    url: (league) =>
      `https://poe.ninja/poe1/api/economy/exchange/current/overview?league=${encodeURIComponent(league)}&type=Scarab`,
  },
  {
    category: "UniqueWeapon",
    url: (league) =>
      `https://poe.ninja/poe1/api/economy/stash/current/item/overview?league=${encodeURIComponent(league)}&type=UniqueWeapon`,
  },
  {
    category: "UniqueArmour",
    url: (league) =>
      `https://poe.ninja/poe1/api/economy/stash/current/item/overview?league=${encodeURIComponent(league)}&type=UniqueArmour`,
  },
  {
    category: "DivinationCard",
    url: (league) =>
      `https://poe.ninja/poe1/api/economy/exchange/current/overview?league=${encodeURIComponent(league)}&type=DivinationCard`,
  },
  {
    category: "SkillGem",
    url: (league) =>
      `https://poe.ninja/poe1/api/economy/stash/current/item/overview?league=${encodeURIComponent(league)}&type=SkillGem`,
  },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function compareSnapshotKeys(left: string, right: string): number {
  const leftTime = Date.parse(left);
  const rightTime = Date.parse(right);

  if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) {
    return leftTime - rightTime;
  }

  return left.localeCompare(right);
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "poe1economy-portfolio-fetcher/1.0",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText} for ${url}`);
  }

  return (await response.json()) as T;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function resolveCurrencyIconSource(imagePath?: string): string | undefined {
  if (!imagePath) {
    return undefined;
  }

  try {
    const url = new URL(imagePath, "https://poe.ninja");

    if (url.pathname.startsWith("/gen/image/")) {
      const encoded = url.pathname.split("/")[3];
      const decoded = Buffer.from(encoded, "base64url").toString("utf8");
      const parsed = JSON.parse(decoded) as unknown;

      if (Array.isArray(parsed)) {
        const fileDescriptor = parsed.find(
          (entry): entry is { f: string } =>
            typeof entry === "object" &&
            entry !== null &&
            "f" in entry &&
            typeof (entry as { f?: unknown }).f === "string",
        );

        if (fileDescriptor) {
          return `https://web.poecdn.com/image/Art/${fileDescriptor.f}.png`;
        }
      }
    }

    return url.toString();
  } catch {
    return undefined;
  }
}

async function mirrorCurrencyIcon(currencyId: string, imagePath?: string): Promise<string | undefined> {
  const sourceUrl = resolveCurrencyIconSource(imagePath);

  if (!sourceUrl) {
    return undefined;
  }

  const extension = path.extname(new URL(sourceUrl).pathname) || ".png";
  const fileName = `${slugify(currencyId)}${extension}`;
  const outputPath = path.join(publicIconsDir, fileName);
  const publicPath = `/icons/currency/${fileName}`;

  if (!(await fileExists(outputPath))) {
    const response = await fetch(sourceUrl, {
      headers: {
        "User-Agent": "poe1economy-portfolio-fetcher/1.0",
        Accept: "image/*,*/*",
      },
    });

    if (!response.ok) {
      return undefined;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await mkdir(publicIconsDir, { recursive: true });
    await writeFile(outputPath, buffer);
  }

  return publicPath;
}

function isCurrencyLine(line: CurrencyLine): line is Required<Pick<CurrencyLine, "id" | "primaryValue">> {
  return typeof line.id === "string" && typeof line.primaryValue === "number" && Number.isFinite(line.primaryValue);
}

function isItemLine(line: ItemLine): line is Required<Pick<ItemLine, "name" | "chaosValue">> & Pick<ItemLine, "icon"> {
  return (
    typeof line.name === "string" &&
    typeof line.chaosValue === "number" &&
    Number.isFinite(line.chaosValue)
  );
}

function normalizeExchangeItems(
  response: ExchangeItemOverviewResponse,
  category: Exclude<ItemCategory, "Currency" | "UniqueWeapon" | "UniqueArmour" | "SkillGem">,
  league: LeagueKey,
  date: string,
): NormalizedItem[] {
  const metadata = new Map<string, ExchangeItemMetadata>();

  for (const item of response.items ?? []) {
    if (typeof item.id === "string") {
      metadata.set(item.id, item);
    }
  }

  return (response.lines ?? [])
    .filter(isCurrencyLine)
    .map((line) => ({
      id: `${slugify(category)}-${slugify(line.id)}`,
      name: metadata.get(line.id)?.name ?? line.id,
      category,
      chaosValue: Number(line.primaryValue.toFixed(2)),
      icon: resolveCurrencyIconSource(metadata.get(line.id)?.image),
      date,
      league,
    }));
}

async function normalizeCurrencyItems(
  response: CurrencyOverviewResponse,
  league: LeagueKey,
  date: string,
): Promise<NormalizedItem[]> {
  const metadata = new Map<string, CurrencyMetadata>();

  for (const item of [...(response.items ?? []), ...(response.core?.items ?? [])]) {
    if (typeof item.id === "string") {
      metadata.set(item.id, item);
    }
  }

  return Promise.all(
    (response.lines ?? [])
      .filter(isCurrencyLine)
      .map(async (line) => ({
        id: `currency-${slugify(line.id)}`,
        name: metadata.get(line.id)?.name ?? line.id,
        category: "Currency" as const,
        chaosValue: Number(line.primaryValue.toFixed(2)),
        icon: await mirrorCurrencyIcon(line.id, metadata.get(line.id)?.image),
        date,
        league,
      })),
  );
}

function normalizeItemOverview(
  response: ItemOverviewResponse,
  category: Exclude<ItemCategory, "Currency">,
  league: LeagueKey,
  date: string,
): NormalizedItem[] {
  return (response.lines ?? [])
    .filter(isItemLine)
    .map((line) => ({
      id: `${slugify(category)}-${slugify(line.name)}`,
      name: line.name,
      category,
      chaosValue: Number(line.chaosValue.toFixed(2)),
      icon: line.icon,
      date,
      league,
    }));
}

function attachDivineValues(items: NormalizedItem[]): NormalizedItem[] {
  const divineOrb = items.find((item) => item.category === "Currency" && item.name === "Divine Orb");
  const divineChaosValue = divineOrb?.chaosValue;

  if (!divineChaosValue || divineChaosValue <= 0) {
    return items;
  }

  return items.map((item) => ({
    ...item,
    divineValue: Number((item.chaosValue / divineChaosValue).toFixed(4)),
  }));
}

async function readLeagueIndex(filePath: string): Promise<LeagueIndexFile | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as LeagueIndexFile;
  } catch (error) {
    const maybeError = error as NodeJS.ErrnoException;
    if (maybeError.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function fetchLeagueSnapshot(league: {
  key: LeagueKey;
  label: LeagueKey;
  slug: LeagueSlug;
  apiLeague: string;
}): Promise<SnapshotFile> {
  const normalized: NormalizedItem[] = [];

  for (const endpoint of ENDPOINTS) {
    const url = endpoint.url(league.apiLeague);
    const payload =
      endpoint.category === "Currency"
        ? await fetchJson<CurrencyOverviewResponse>(url)
        : endpoint.category === "Scarab" || endpoint.category === "DivinationCard"
          ? await fetchJson<ExchangeItemOverviewResponse>(url)
          : await fetchJson<ItemOverviewResponse>(url);

    if (endpoint.category === "Currency") {
      normalized.push(
        ...(await normalizeCurrencyItems(
          payload as CurrencyOverviewResponse,
          league.key,
          snapshotTimestamp,
        )),
      );
    } else if (endpoint.category === "Scarab" || endpoint.category === "DivinationCard") {
      normalized.push(
        ...normalizeExchangeItems(
          payload as ExchangeItemOverviewResponse,
          endpoint.category,
          league.key,
          snapshotTimestamp,
        ),
      );
    } else {
      normalized.push(
        ...normalizeItemOverview(
          payload as ItemOverviewResponse,
          endpoint.category,
          league.key,
          snapshotTimestamp,
        ),
      );
    }

    await delay(250);
  }

  return {
    date: snapshotTimestamp,
    league: league.key,
    items: attachDivineValues(normalized),
  };
}

async function updateLeagueFiles(league: {
  key: LeagueKey;
  label: LeagueKey;
  slug: LeagueSlug;
  apiLeague: string;
}): Promise<void> {
  const leagueDir = path.join(publicDataDir, league.slug);
  const snapshotsDir = path.join(leagueDir, "snapshots");
  const snapshotPath = path.join(snapshotsDir, `${snapshotFileStamp}.json`);
  const indexPath = path.join(leagueDir, "index.json");

  const snapshot = await fetchLeagueSnapshot(league);
  await writeJson(snapshotPath, snapshot);

  const existingIndex = await readLeagueIndex(indexPath);
  const dates = Array.from(new Set([...(existingIndex?.dates ?? []), snapshotTimestamp])).sort((left, right) =>
    compareSnapshotKeys(left, right),
  );

  const snapshotPaths = {
    ...(existingIndex?.snapshotPaths ?? {}),
    [snapshotTimestamp]: `/data/${league.slug}/snapshots/${snapshotFileStamp}.json`,
  };

  const updatedIndex: LeagueIndexFile = {
    league: league.key,
    slug: league.slug,
    generatedAt: new Date().toISOString(),
    latest: dates[dates.length - 1] ?? null,
    dates,
    snapshotPaths,
  };

  await writeJson(indexPath, updatedIndex);
}

async function updateRootIndex(): Promise<void> {
  const rootIndex: RootIndexFile = {
    generatedAt: new Date().toISOString(),
    defaultLeague: "Mirage",
    leagues: LEAGUES.map((league) => ({
      key: league.key,
      label: league.label,
      slug: league.slug,
      indexPath: `/data/${league.slug}/index.json`,
    })),
  };

  await writeJson(path.join(publicDataDir, "index.json"), rootIndex);
}

async function main(): Promise<void> {
  for (const league of LEAGUES) {
    console.log(`Fetching ${league.label}...`);
    await updateLeagueFiles(league);
  }

  await updateRootIndex();
  console.log(`Finished writing snapshots for ${snapshotTimestamp}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
