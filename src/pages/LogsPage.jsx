import { SectionHeader, TableEmptyState } from '../components/index.jsx';
import { formatDateTime, formatInteger } from '../lib/utils.js';

export function LogsPage({
  apiBaseUrl,
  logQuery,
  setLogQuery,
  selectedLogLabel,
  setSelectedLogLabel,
  filteredLogs,
  logEntries,
  logsResource,
  logTextResource,
  loadLogText,
  copiedKey,
  onCopy,
  getApiLink,
}) {
  return (
    <section className="section-card">
      <SectionHeader
        eyebrow="Logs"
        title="Logs"
        actions={
          <div className="toolbar-group toolbar-group--tight">
            <label className="field field--wide">
              <span className="field__label">Search logs</span>
              <input
                className="field__input"
                type="search"
                value={logQuery}
                onChange={(event) => {
                  setLogQuery(event.target.value)
                }}
                placeholder="Label or filename"
              />
            </label>

            <button
              type="button"
              className="button"
              onClick={() => {
                void loadLogText(selectedLogLabel)
              }}
              disabled={!selectedLogLabel || logTextResource.refreshing}
            >
              {logTextResource.refreshing ? 'Refreshing…' : 'Refresh log'}
            </button>
          </div>
        }
      />

      <div className="two-column-layout two-column-layout--logs">
        <article className="panel-card panel-card--flush">
          <div className="panel-card__header panel-card__header--padded">
            <h3>Available logs</h3>
            <span className="panel-card__meta">{formatInteger(filteredLogs.length)} labels</span>
          </div>

          {logsResource.loading && logEntries.length === 0 ? (
            <TableEmptyState message="Loading container logs…" />
          ) : filteredLogs.length === 0 ? (
            <TableEmptyState message={logsResource.error || 'No logs match the current search.'} />
          ) : (
            <div className="log-list">
              {filteredLogs.map((entry) => (
                <button
                  key={entry.label}
                  type="button"
                  className={`log-list__item${entry.label === selectedLogLabel ? ' is-active' : ''}`}
                  onClick={() => {
                    setSelectedLogLabel(entry.label)
                  }}
                >
                  <span className="log-list__title">{entry.label}</span>
                  <span className="log-list__meta">
                    {entry.filename} · {formatInteger(entry.size_bytes)} bytes
                  </span>
                </button>
              ))}
            </div>
          )}
        </article>

        <article className="panel-card panel-card--flush">
          <div className="panel-card__header panel-card__header--padded">
            <div>
              <h3>{selectedLogLabel || 'Raw log viewer'}</h3>
              <span className="panel-card__meta">
                {apiBaseUrl ? apiBaseUrl : 'Using local /api proxy'}
              </span>
            </div>

            {selectedLogLabel ? (
              <button
                type="button"
                className="button button--ghost"
                onClick={() => {
                  onCopy(
                    getApiLink(`/api/container-log/${encodeURIComponent(selectedLogLabel)}`),
                    `raw-log-link-${selectedLogLabel}`,
                  )
                }}
              >
                {copiedKey === `raw-log-link-${selectedLogLabel}` ? 'Link copied' : 'Copy raw link'}
              </button>
            ) : null}
          </div>

          {logTextResource.loading && !logTextResource.data ? (
            <TableEmptyState message="Loading selected log…" />
          ) : logTextResource.error && !logTextResource.data ? (
            <TableEmptyState message={logTextResource.error} />
          ) : (
            <pre className="log-viewer">{logTextResource.data || 'Select a log label to inspect.'}</pre>
          )}
        </article>
      </div>
    </section>
  )
}