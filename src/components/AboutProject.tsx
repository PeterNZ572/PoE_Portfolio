export function AboutProject() {
  return (
    <section className="panel about-panel">
      <div className="panel-header">
        <h2>About This Project</h2>
        <p>Designed to show a static-site ETL workflow, not a live backend service.</p>
      </div>

      <div className="about-grid">
        <article>
          <h3>Pipeline</h3>
          <p>
            A Node 22 fetch script calls third-party poe.ninja endpoints for all supported leagues
            and categories, normalizes the payloads, and writes dated JSON snapshots into
            <code>/public/data/&lt;league&gt;/snapshots</code>.
          </p>
        </article>

        <article>
          <h3>Storage Strategy</h3>
          <p>
            Each league has its own <code>index.json</code> manifest that lists available snapshot
            dates. The React frontend only reads local static files, which keeps the deployment
            GitHub Pages compatible and avoids frontend polling against a third-party service.
          </p>
        </article>

        <article>
          <h3>Analytics</h3>
          <p>
            The dashboard computes latest prices, prior-snapshot comparisons, and 7-day or 30-day
            percentage changes from the saved history. If history is missing, the UI explicitly says
            that more data is needed.
          </p>
        </article>
      </div>
    </section>
  );
}
