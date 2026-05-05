import type { LeagueKey } from "../types";
import { LEAGUE_OPTIONS } from "../types";

interface HeaderProps {
  league: LeagueKey;
  onLeagueChange: (league: LeagueKey) => void;
  latestDate: string | null;
}

const snapshotDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

const snapshotDayFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
});

function formatLatestSnapshot(value: string | null): string {
  if (!value) {
    return "No snapshots yet";
  }

  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return value;
  }

  return value.includes("T")
    ? snapshotDateFormatter.format(new Date(parsed))
    : snapshotDayFormatter.format(new Date(parsed));
}

export function Header({ league, onLeagueChange, latestDate }: HeaderProps) {
  return (
    <header className="hero-panel">
      <div>
        <p className="eyebrow">Static ETL Portfolio Project</p>
        <h1>Path of Exile Economy Dashboard</h1>
        <p className="hero-copy">
          Historical poe.ninja snapshots rendered as a GitHub Pages-friendly React dashboard with
          multi-league filtering, trend analysis, and static JSON data delivery.
        </p>
        <p className="data-note">
          ✨ Static dashboard powered by scheduled GitHub Actions data snapshots.
        </p>
      </div>

      <div className="hero-controls">
        <label className="field">
          <span>League</span>
          <select value={league} onChange={(event) => onLeagueChange(event.target.value as LeagueKey)}>
            {LEAGUE_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="snapshot-badge">
          <span>Latest Snapshot</span>
          <strong>{formatLatestSnapshot(latestDate)}</strong>
        </div>
      </div>
    </header>
  );
}
