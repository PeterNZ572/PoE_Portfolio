import { useMemo, useState } from "react";
import { SCARAB_REGEX_BY_NAME } from "../data/scarabRegex";
import { formatChaos } from "../lib/format";
import type { ItemWithTrends } from "../types";

interface ScarabRecipeToolProps {
  items: ItemWithTrends[];
}

function buildRegex(items: ItemWithTrends[]): string {
  const tokens = items
    .map((item) => SCARAB_REGEX_BY_NAME[item.name])
    .filter((token): token is string => typeof token === "string" && token.length > 0);

  return tokens.length > 0 ? `"${tokens.join("|")}"` : "";
}

export function ScarabRecipeTool({ items }: ScarabRecipeToolProps) {
  const [maxChaosValue, setMaxChaosValue] = useState("1");
  const threshold = Number(maxChaosValue);
  const hasValidThreshold = Number.isFinite(threshold) && threshold >= 0;

  const eligibleScarabs = useMemo(() => {
    if (!hasValidThreshold) {
      return [];
    }

    return [...items]
      .filter((item) => item.chaosValue <= threshold)
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [hasValidThreshold, items, threshold]);

  const regex = useMemo(() => buildRegex(eligibleScarabs), [eligibleScarabs]);
  const missingRegexCount = eligibleScarabs.filter((item) => !SCARAB_REGEX_BY_NAME[item.name]).length;

  return (
    <section className="panel scarab-tool-panel">
      <div className="panel-header">
        <div>
          <h2>3TO1</h2>
          <p>Build a poe.re-compatible regex for Scarabs at or below a Chaos threshold in the selected league.</p>
        </div>
      </div>

      <div className="scarab-tool-grid">
        <label className="field">
          <span>Max Chaos Value</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={maxChaosValue}
            onChange={(event) => setMaxChaosValue(event.target.value)}
            placeholder="1.00"
          />
        </label>

        <div className="scarab-tool-stat">
          <span>Matches</span>
          <strong>{eligibleScarabs.length}</strong>
        </div>

        <div className="scarab-tool-stat">
          <span>Regex Tokens</span>
          <strong>{regex ? regex.slice(1, -1).split("|").length : 0}</strong>
        </div>
      </div>

      <label className="field">
        <span>Regex Output</span>
        <textarea
          className="regex-output"
          readOnly
          value={hasValidThreshold ? regex : ""}
          placeholder="Set a valid Chaos value to generate a regex string."
        />
      </label>

      <div className="scarab-tool-meta">
        <p className="subtle-copy">
          {hasValidThreshold
            ? `Includes every Scarab priced at ${formatChaos(threshold)} Chaos or less in the selected league.`
            : "Enter a non-negative Chaos value to generate a regex."}
        </p>
        {missingRegexCount > 0 ? (
          <p className="subtle-copy">
            {missingRegexCount} matched Scarab{missingRegexCount === 1 ? "" : "s"} missing a poe.re token were skipped.
          </p>
        ) : null}
      </div>

      <div className="scarab-tool-list">
        {eligibleScarabs.length > 0 ? (
          eligibleScarabs.map((item) => (
            <span key={item.id} className="scarab-tool-chip">
              {item.name}
              <strong>{formatChaos(item.chaosValue)}c</strong>
            </span>
          ))
        ) : (
          <p className="subtle-copy">No Scarabs meet the current threshold.</p>
        )}
      </div>
    </section>
  );
}
