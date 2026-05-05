# Path of Exile Economy Dashboard

**[🔴 Live Dashboard](https://peternz572.github.io/PoE_Portfolio/)** | Built as a portfolio data analytics project

Static React dashboard for exploring Path of Exile economy snapshots sourced from `poe.ninja`. The app is built to run on GitHub Pages with no backend server: data is fetched offline, normalized into static JSON snapshots, committed to the repo, and then rendered in the browser.

## Portfolio Notes

This project demonstrates a **complete static data analytics workflow**:

- **API Ingestion**: Fetches economy data from third-party poe.ninja API endpoints
- **Scheduled ETL**: GitHub Actions runs a Node script on a schedule to normalize and snapshot data
- **Time-Series Storage**: Historical snapshots stored as static JSON files in version control
- **React Dashboard**: Multi-page analytics dashboard with filtering, search, and trend analysis
- **No Backend**: Entire application runs on GitHub Pages — no server infrastructure required
- **Third-Party Data Source**: `poe.ninja` serves as the authoritative economy feed

## Key Metrics

This is not just a charting demo. It shows:
- **External API integration** and payload normalization
- **Data pipeline automation** (scheduled data collection)
- **Static file deployment** (GitHub Pages friendly)
- **Multi-view analytics** (latest prices, trends, movers)
- **Time-series comparison** (7-day, 30-day performance)
- **Responsive UX** (dark theme, league selection, favorites, search)

## Live Project Summary

This project demonstrates:

- API ingestion from third-party economy sources
- Scheduled ETL-style data collection with GitHub Actions
- Timestamped static snapshot storage under `public/data`
- Time-series analytics from historical snapshots
- Multi-league filtering and search
- Responsive React dashboard design
- GitHub Pages deployment without server infrastructure
- Professional empty/loading/error state handling

## Tech Stack

- Node 22
- Vite
- React
- TypeScript
- Recharts
- GitHub Actions
- GitHub Pages

## Features

- League selector for `Mirage`, `Hardcore Mirage`, `Standard`, and `Hardcore Standard`
- Search, category filtering, and sorting
- Latest prices table
- Favorites
- Biggest gainers and losers cards
- Single-item trend chart
- Multi-item comparison chart
- Chaos price vs divine price chart toggles
- Historical analytics from saved snapshots only
- Responsive dark dashboard layout

## Why This Works as a Portfolio Project

Instead of a mock dashboard, this is a **production-ready data product**:

1. **Real External Data**: Connected to live poe.ninja endpoints, not hardcoded fixtures
2. **Scheduled Automation**: GitHub Actions runs fetch jobs on a schedule to keep data fresh
3. **Pipeline Architecture**: Separates data ingestion, normalization, and storage from rendering
4. **Static Deployment**: Zero backend — entire site runs from generated JSON and React
5. **Time-Series Analytics**: Demonstrates historical trend analysis and comparison logic
6. **Professional UX**: Comprehensive filtering, search, favorites, and analytics across multiple views

## Project Structure

```text
.
|-- .github/
|   `-- workflows/
|       |-- deploy.yml
|       `-- fetch-data.yml
|-- public/
|   |-- data/
|   |   |-- index.json
|   |   |-- mirage/
|   |   |-- hardcore-mirage/
|   |   |-- standard/
|   |   `-- hardcore-standard/
|   `-- icons/
|       `-- currency/
|-- scripts/
|   `-- fetch-poe-data.ts
|-- src/
|   |-- components/
|   |-- lib/
|   |-- App.tsx
|   |-- main.tsx
|   |-- styles.css
|   `-- types.ts
|-- index.html
|-- package.json
|-- vite.config.ts
`-- README.md
```

## Local Development

Install dependencies and start the Vite dev server:

```bash
npm install
npm run dev
```

The app reads local snapshot files from `public/data` and defaults to the `Mirage` league.

## Available Scripts

```bash
npm run dev
npm run build
npm run preview
npm run typecheck
npm run fetch:data
```

## Data Pipeline

### Frontend

The frontend never calls `poe.ninja` directly.

It loads static files in this flow:

1. Read `public/data/index.json`
2. Resolve the selected league manifest
3. Read that league's snapshot index
4. Load snapshot JSON files from `public/data/{league}/snapshots`
5. Compute current values and historical changes in the browser

This keeps the site GitHub Pages-compatible and avoids live client-side polling against a third-party source.

### Fetch Script

Manual run:

```bash
npm run fetch:data
```

The fetch script:

1. Loops through all four supported leagues
2. Calls the relevant `poe.ninja` economy endpoints
3. Normalizes records into a shared item shape
4. Saves a new timestamped snapshot for each league
5. Updates each league's `index.json`
6. Updates the root `public/data/index.json`

### Snapshot Format

Normalized records use this shape:

```json
{
  "id": "string",
  "name": "string",
  "category": "string",
  "chaosValue": 0,
  "divineValue": 0,
  "icon": "string",
  "date": "2026-05-05T09:34:46.137Z",
  "league": "Mirage"
}
```

Snapshots are stored per league:

```text
public/data/{league}/snapshots/YYYY-MM-DDTHH-mm-ss-sssZ.json
```

Important behavior:

- snapshots are timestamped with date and time
- each fetch creates a new file
- historical files are preserved
- existing snapshots are not overwritten

## League Support

Supported leagues:

- `Mirage`
- `Hardcore Mirage`
- `Standard`
- `Hardcore Standard`

The selected league controls:

- which static history the UI loads
- which prices and analytics are displayed
- which league parameter the fetch script uses when calling `poe.ninja`

## Trend Analytics

The dashboard derives metrics from stored history, including:

- latest price
- previous snapshot price
- 7-day percentage change when enough data exists
- 30-day percentage change when enough data exists

When history is limited, the UI falls back gracefully instead of showing misleading values.

## GitHub Actions

### Scheduled Data Fetch

Workflow: `.github/workflows/fetch-data.yml`

- runs every 6 hours
- can also be triggered manually with `workflow_dispatch`
- uses Node 22
- runs `npm ci`
- runs `npm run fetch:data`
- commits updated `public/data` and `public/icons` when changes exist

Current cron:

```text
0 */6 * * *
```

### GitHub Pages Deployment

Workflow: `.github/workflows/deploy.yml`

- runs on pushes to `main`
- can also be triggered manually
- builds the Vite app
- uses the GitHub Pages base path during build
- uploads `dist`
- deploys the static site through GitHub Pages

## GitHub Pages Setup

The Vite config is set up for Pages deployment using an environment-provided base path so the app can work under a repository subpath.

Typical deployment flow:

1. Push to `main`
2. GitHub Actions builds the site
3. The Pages workflow publishes `dist`
4. The dashboard serves static assets and static snapshot JSON directly from the repo

## Notes on Data Source

`poe.ninja` is a third-party data source. It is not an official Grinding Gear Games API.

This project intentionally uses snapshot caching behavior instead of live frontend requests because:

- third-party APIs can change shape
- static snapshots are more reliable for portfolio hosting
- historical analysis requires persisted point-in-time data
- GitHub Pages cannot run backend refresh logic

## Mock Data

The repository includes starter snapshot data for all four leagues so the dashboard works immediately before scheduled fetches populate a larger history.

## Suggested Setup

If you want to use this project yourself:

```bash
npm install
npm run fetch:data
npm run build
```

Then push the repository to GitHub and enable GitHub Pages plus Actions.
