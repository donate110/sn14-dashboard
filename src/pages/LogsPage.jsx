import { useState, useMemo } from 'react';
import { SectionHeader, TableEmptyState } from '../components/index.jsx';
import { formatDateTime, formatInteger } from '../lib/utils.js';

export function LogsPage({
  title = 'Logs',
  eyebrow = 'Logs',
  isValidatorView = false,
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
  const [sortOrder, setSortOrder] = useState('newest');

  const sortedLogs = useMemo(() => {
    const logs = [...filteredLogs];
    logs.sort((a, b) => {
      if (sortOrder === 'newest') {
        const getBlockOrTime = (label) => {
          const cMatch = label.match(/_(\d+)(?:\.log)?$/);
          if (cMatch) return parseInt(cMatch[1], 10);
          const vMatch = label.match(/_(\d{8})_(\d{6})/);
          if (vMatch) return parseInt(vMatch[1] + vMatch[2], 10);
          return 0;
        };
        return getBlockOrTime(b.label) - getBlockOrTime(a.label);
      } else if (sortOrder === 'uid') {
        const getUid = (label) => {
          const match = label.match(/uid(\d+)/);
          return match ? parseInt(match[1], 10) : -1;
        };
        return getUid(a.label) - getUid(b.label);
      }
      return 0;
    });
    return logs;
  }, [filteredLogs, sortOrder]);

  return (
    <section className="section-card">
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
      />
      <div className="toolbar-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', width: '100%', justifyContent: 'flex-end' }}>
            {!isValidatorView && (
              <div className="segmented-control" style={{ flexShrink: 0 }}>
              {[
                ['newest', 'Newest to Oldest'],
                ['uid', 'Sort by UID'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`segmented-control__button${sortOrder === value ? ' is-active' : ''}`}
                  onClick={() => setSortOrder(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            )}

            <label className="field field--wide">
              <input
                className="field__input"
                type="search"
                value={logQuery}
                onChange={(event) => {
                  setLogQuery(event.target.value)
                }}
                placeholder="Search logs"
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

      <div className="two-column-layout two-column-layout--logs">
        <article className="panel-card panel-card--flush">
          <div className="panel-card__header panel-card__header--padded">
            <h3>Available logs</h3>
            <span className="panel-card__meta">{formatInteger(sortedLogs.length)} labels</span>
          </div>

          {logsResource.loading && logEntries.length === 0 ? (
            <TableEmptyState message="Loading container logs…" />
          ) : sortedLogs.length === 0 ? (
            <TableEmptyState message={logsResource.error || 'No logs match the current search.'} />
          ) : (
            <div className="log-list">
              {sortedLogs.map((entry) => (
                <button
                  key={entry.label}
                  type="button"
                  className={`log-list__item${entry.label === selectedLogLabel ? ' is-active' : ''}`}
                  onClick={() => {
                    setSelectedLogLabel(entry.label)
                  }}
                >
                  <span className="log-list__title" style={{
                    color: isValidatorView ? (entry.label.startsWith('cpu_') ? 'var(--color-warm)' : entry.label.startsWith('gpu_') ? 'var(--color-accent-strong)' : undefined) : undefined
                  }}>{entry.label}</span>
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
                    getApiLink((selectedLogLabel.startsWith('cpu_validator_') || selectedLogLabel.startsWith('gpu_eval_') ? '/api/validator-log/' : '/api/container-log/') + encodeURIComponent(selectedLogLabel)),
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