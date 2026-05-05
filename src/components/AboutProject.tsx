export function AboutProject() {
  return (
    <section className="panel about-panel">
      <div className="panel-header">
        <h2>About This Project</h2>
        <p>Designed to show a static-site ETL workflow, not a live backend service.</p>
      </div>

      <div className="about-grid">
        <article>
          <h3>Data Pipeline</h3>
          <p>
            <code>poe.ninja API</code> → <code>GitHub Actions</code> → <code>JSON Snapshots</code> → <code>React</code>
          </p>
          <p className="subtle-copy">
            Scheduled job normalizes API responses and commits timestamped snapshots to version control.
            Frontend reads only static files from the repo.
          </p>
        </article>

        <article>
          <h3>Fetching</h3>
          <p>
            TypeScript script validates and normalizes poe.ninja payloads across all leagues and item categories,
            handling inconsistent schemas and writing timestamped JSON to <code>/public/data/</code>.
          </p>
        </article>

        <article>
          <h3>Storage</h3>
          <p>
            Each league maintains an <code>index.json</code> manifest of available snapshots. Frontend loads data
            on-demand—no third-party API calls, fully GitHub Pages compatible.
          </p>
        </article>

        <article>
          <h3>Analytics</h3>
          <p>
            Dashboard computes latest prices, historical comparisons, and 7-day / 30-day changes from snapshot history.
            Missing history is explicitly indicated.
          </p>
        </article>
      </div>
    </section>
  );
}
