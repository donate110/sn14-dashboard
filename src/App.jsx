import { useDeferredValue, useEffect, useEffectEvent, useState } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { Analytics } from "@vercel/analytics/react"
import './App.css'

const DEFAULT_API_BASE_URL = ''
const AUTO_REFRESH_MS = 60_000
const THEME_STORAGE_KEY = 'sn14-dashboard-theme'

const NAV_ITEMS = [
  { to: '/overview', label: 'Overview' },
  { to: '/king', label: 'King' },
  { to: '/evaluations', label: 'Evaluations' },
  { to: '/logs', label: 'Logs' },
  { to: '/rounds', label: 'Rounds' },
]

const FOOTER_LINKS = [
  {
    label: 'Website',
    href: 'https://cacheon.ai/',
    description: 'cacheon.ai',
    icon: 'globe',
  },
  {
    label: 'Docs',
    href: 'https://cacheon.ai/docs',
    description: 'Project documentation',
    icon: 'docs',
  },
  {
    label: 'GitHub repository',
    href: 'https://github.com/latent-to/cacheon',
    description: 'latent-to/cacheon',
    icon: 'github',
  },
  {
    label: 'X',
    href: 'https://x.com/cacheon_ai',
    description: '@cacheon_ai',
    icon: 'x',
  },
  {
    label: 'TAO.app',
    href: 'https://tao.app/subnets/14',
    description: 'Subnet 14 profile',
    icon: 'tao',
  },
]

function normalizeBaseUrl(value) {
  return (value || DEFAULT_API_BASE_URL).replace(/\/$/, '')
}

function createResourceState() {
  return {
    data: null,
    error: '',
    loading: false,
    refreshing: false,
  }
}

function getInitialTheme() {
  if (typeof window === 'undefined') {
    return 'dark'
  }

  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme
  }

  return 'dark'
}

async function fetchResource(baseUrl, path, parser = 'json') {
  const response = await fetch(`${baseUrl}${path}`)

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  if (parser === 'text') {
    return response.text()
  }

  return response.json()
}

function formatDateTime(value) {
  if (value === null || value === undefined) {
    return 'Unknown'
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value * 1000))
}

function formatCompactDateTime(value) {
  if (!value) {
    return 'Pending'
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value * 1000))
}

function formatInteger(value) {
  if (value === null || value === undefined) {
    return '0'
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value)
}

function formatMetric(value, digits = 3) {
  if (value === null || value === undefined) {
    return 'Not available'
  }

  if (Math.abs(value) >= 1_000) {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  }

  if (Math.abs(value) >= 1) {
    return value.toFixed(Math.min(digits, 2))
  }

  return value.toFixed(digits)
}

function formatPercent(value) {
  if (value === null || value === undefined) {
    return 'Not available'
  }

  return `${(value * 100).toFixed(1)}%`
}

function formatMinutes(value) {
  if (value === null || value === undefined) {
    return 'Unknown'
  }

  if (value < 1) {
    return 'Just now'
  }

  if (value < 60) {
    return `${Math.round(value)} min ago`
  }

  const hours = value / 60
  if (hours < 24) {
    return `${hours.toFixed(1)} h ago`
  }

  return `${(hours / 24).toFixed(1)} d ago`
}

function truncateMiddle(value, prefix = 10, suffix = 8) {
  if (!value || value.length <= prefix + suffix + 1) {
    return value || 'Not available'
  }

  return `${value.slice(0, prefix)}...${value.slice(-suffix)}`
}

function DockerImageLink({ image, truncate = false, prefix = 20, suffix = 16 }) {
  if (!image) return 'Not available'
  
  const display = truncate ? truncateMiddle(image, prefix, suffix) : image
  
  let href = null
  if (image.startsWith('docker.io/')) {
    const repo = image.substring(10).split(':')[0]
    href = `https://hub.docker.com/r/${repo}`
  } else if (image.startsWith('ghcr.io/')) {
    const repo = image.substring(8).split(':')[0]
    href = `https://github.com/${repo}`
  } else if (image.includes('/') && !image.includes('.')) {
    const repo = image.split(':')[0]
    href = `https://hub.docker.com/r/${repo}`
  }

  if (href) {
    return (
      <a 
        href={href} 
        target="_blank" 
        rel="noreferrer" 
        className="image-link" 
        title={`View image repository for ${image}`}
        onClick={(e) => e.stopPropagation()}
      >
        {display}
      </a>
    )
  }

  return <span title={image}>{display}</span>
}

function getStatusTone(disqualified) {
  return disqualified ? 'danger' : 'success'
}

function MetricCard({ label, value, caption, tone = 'default' }) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <span className="metric-card__label">{label}</span>
      <strong className="metric-card__value">{value}</strong>
      {caption ? <span className="metric-card__caption">{caption}</span> : null}
    </article>
  )
}

function StatusBadge({ tone, children }) {
  return <span className={`status-badge status-badge--${tone}`}>{children}</span>
}

function SectionHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="section-header">
      <div>
        <p className="section-header__eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {description ? <p className="section-header__description">{description}</p> : null}
      </div>
      {actions ? <div className="section-header__actions">{actions}</div> : null}
    </div>
  )
}

function TableEmptyState({ message }) {
  return <div className="table-empty-state">{message}</div>
}

function CopyValueButton({ value, label, copiedKey, onCopy, className = '' }) {
  const isCopied = copiedKey === label;

  return (
    <button
      type="button"
      className={`copy-value-button${isCopied ? ' is-copied' : ''}${className ? ` ${className}` : ''}`}
      onClick={() => {
        onCopy(value, label)
      }}
      title={`Copy ${label}`}
      style={{ animationDelay: `${Math.random() * 0.5}s` }}
    >
      <span>{truncateMiddle(value, 14, 10)}</span>
      <span className="copy-value-button__icon-wrapper">
        {isCopied ? (
          <svg viewBox="0 0 24 24" aria-hidden="true" className="copy-value-button__icon text-success">
            <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true" className="copy-value-button__icon">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    </button>
  )
}

function ThemeToggleIcon({ theme }) {
  if (theme === 'dark') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="theme-toggle__icon">
        <circle cx="12" cy="12" r="4.25" fill="currentColor" />
        <path
          d="M12 1.75v3.1M12 19.15v3.1M4.75 4.75l2.2 2.2M17.05 17.05l2.2 2.2M1.75 12h3.1M19.15 12h3.1M4.75 19.25l2.2-2.2M17.05 6.95l2.2-2.2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="theme-toggle__icon">
      <path
        d="M14.5 2.4a8.8 8.8 0 1 0 7.1 13.98A9.7 9.7 0 0 1 14.5 2.4Z"
        fill="currentColor"
      />
    </svg>
  )
}

function LinkIcon({ type }) {
  if (type === 'docs') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="link-card__icon-svg">
        <path
          d="M6 4.5h9l3 3V19a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5 19V6A1.5 1.5 0 0 1 6.5 4.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M15 4.5V8h3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    )
  }

  if (type === 'github') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="link-card__icon-svg">
        <path
          d="M12 2.5a9.5 9.5 0 0 0-3 18.52c.47.08.64-.2.64-.46v-1.6c-2.62.57-3.17-1.12-3.17-1.12-.43-1.07-1.05-1.35-1.05-1.35-.86-.58.06-.57.06-.57.95.07 1.46.96 1.46.96.85 1.43 2.22 1.02 2.77.78.08-.6.33-1.02.6-1.26-2.09-.23-4.29-1.03-4.29-4.58 0-1.01.37-1.83.98-2.48-.1-.23-.42-1.16.09-2.41 0 0 .8-.25 2.62.95A9.2 9.2 0 0 1 12 7.75c.81 0 1.62.11 2.38.33 1.82-1.2 2.62-.95 2.62-.95.51 1.25.19 2.18.09 2.41.61.65.98 1.47.98 2.48 0 3.56-2.2 4.35-4.31 4.58.34.29.65.86.65 1.73v2.23c0 .26.17.54.65.45A9.5 9.5 0 0 0 12 2.5Z"
          fill="currentColor"
        />
      </svg>
    )
  }

  if (type === 'x') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="link-card__icon-svg">
        <path
          d="M5 4.5h3.6l4.18 5.6 4.92-5.6H19l-5.5 6.23L19.5 19.5h-3.6l-4.5-6.04-5.31 6.04H4.5l5.95-6.75L5 4.5Z"
          fill="currentColor"
        />
      </svg>
    )
  }

  if (type === 'tao') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" className="link-card__icon-svg">
        <path fill="currentColor" d="M16.735 4.273v1.61H5.229v-1.61h11.506Zm-6.712 0h1.716v11.61c0 .531.064.921.192 1.17.134.244.307.4.518.47.21.064.428.096.652.096.236 0 .463-.041.68-.124.224-.083.416-.18.576-.288l.46 1.38c-.383.276-.754.454-1.112.538-.358.09-.716.134-1.074.134-.85 0-1.499-.265-1.946-.796-.441-.53-.662-1.387-.662-2.57V4.273Z"></path>
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="link-card__icon-svg">
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M3.75 12h16.5M12 3.75a13 13 0 0 1 0 16.5M12 3.75a13 13 0 0 0 0 16.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function FooterLinkCard({ label, href, description, icon }) {
  return (
    <a className="link-card" href={href} target="_blank" rel="noreferrer">
      <span className="link-card__icon">
        <LinkIcon type={icon} />
      </span>
      <span className="link-card__body">
        <strong>{label}</strong>
        <span>{description}</span>
      </span>
    </a>
  )
}

function OverviewPage({ healthResource, status }) {
  return (
    <div className="page-stack">
      <section className="overview-grid">
        <MetricCard
          label="API health"
          value={healthResource.error ? 'Attention needed' : 'Live'}
          tone={healthResource.error ? 'danger' : 'success'}
        />
        <MetricCard
          label="Evaluations"
          value={formatInteger(status?.n_evaluated)}
        />
        <MetricCard
          label="Active miners"
          value={formatInteger(status?.n_active)}
          tone="success"
        />
        <MetricCard
          label="Disqualified"
          value={formatInteger(status?.n_disqualified)}
          tone="danger"
        />
        <MetricCard
          label="Current king"
          value={status?.king_uid !== undefined ? `UID ${status.king_uid}` : 'Pending'}
          tone="accent"
        />
        <MetricCard
          label="Last evaluation"
          value={formatMinutes(status?.last_eval_age_min)}
        />
      </section>

      <section className="section-card">
        <SectionHeader eyebrow="Overview" title="Status" />

        <div className="status-grid">
          <div className="info-card">
            <span className="info-card__label">King image</span>
            <strong className="info-card__value">
              <DockerImageLink image={status?.king_image} />
            </strong>
          </div>
          <div className="info-card">
            <span className="info-card__label">Last scan block</span>
            <strong className="info-card__value">{formatInteger(status?.last_scan_block)}</strong>
          </div>
          <div className="info-card">
            <span className="info-card__label">Weights set block</span>
            <strong className="info-card__value">{formatInteger(status?.last_weights_set_block)}</strong>
          </div>
        </div>
      </section>
    </div>
  )
}

function KingPage({ king, kingHistory, kingHistoryResource, copiedKey, onCopy }) {
  return (
    <section className="section-card">
      <SectionHeader eyebrow="King" title="King" />

      <div className="two-column-layout">
        <article className="spotlight-card">
          <div className="spotlight-card__header">
            <div>
              <span className="spotlight-card__eyebrow">Current king</span>
              <h3>{king ? `UID ${king.uid}` : 'Waiting for king data'}</h3>
            </div>
            <StatusBadge tone="accent">Score {formatMetric(king?.score, 6)}</StatusBadge>
          </div>

          <dl className="definition-grid">
            <div>
              <dt>Image</dt>
              <dd><DockerImageLink image={king?.image} /></dd>
            </div>
            <div>
              <dt>Hotkey</dt>
              <dd>
                {king?.hotkey ? (
                  <CopyValueButton
                    value={king.hotkey}
                    label={`king-hotkey-${king.uid}`}
                    copiedKey={copiedKey}
                    onCopy={onCopy}
                  />
                ) : (
                  'Not available'
                )}
              </dd>
            </div>
            <div>
              <dt>Evaluation block</dt>
              <dd>{formatInteger(king?.evaluation_block)}</dd>
            </div>
            <div>
              <dt>Commit block</dt>
              <dd>{formatInteger(king?.commit_block)}</dd>
            </div>
            <div>
              <dt>Token match rate</dt>
              <dd>{formatPercent(king?.token_match_rate)}</dd>
            </div>
            <div>
              <dt>Throughput improvement</dt>
              <dd>{formatMetric(king?.throughput_improvement, 6)}</dd>
            </div>
            <div>
              <dt>TTFT improvement</dt>
              <dd>{formatMetric(king?.ttft_improvement, 6)}</dd>
            </div>
            <div>
              <dt>Evaluated at</dt>
              <dd>{formatDateTime(king?.evaluated_at)}</dd>
            </div>
          </dl>
        </article>

        <article className="panel-card">
          <div className="panel-card__header">
            <h3>History</h3>
            <span className="panel-card__meta">{formatInteger(kingHistoryResource.data?.total)} entries</span>
          </div>

          {kingHistory.length === 0 ? (
            <TableEmptyState message={kingHistoryResource.error || 'No dethronement history found.'} />
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Block</th>
                    <th>New king</th>
                    <th>Score</th>
                    <th>Image</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {kingHistory.map((entry) => (
                    <tr key={`${entry.block}-${entry.new_king_uid}`}>
                      <td>{formatInteger(entry.block)}</td>
                      <td>{`UID ${entry.new_king_uid}`}</td>
                      <td>{formatMetric(entry.new_king_score, 6)}</td>
                      <td><DockerImageLink image={entry.new_king_image} truncate={true} prefix={20} suffix={16} /></td>
                      <td>{formatCompactDateTime(entry.ts)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </div>
    </section>
  )
}

function EvaluationsPage({
  evaluationFilter,
  setEvaluationFilter,
  evaluationQuery,
  setEvaluationQuery,
  filteredEvaluations,
  evaluations,
  evaluationsResource,
  selectedEvaluationUid,
  setSelectedEvaluationUid,
  evaluationHistoryResource,
  evaluationHistory,
  latestSelectedEvaluation,
  bestScore,
  disqualifiedCount,
  copiedKey,
  onCopy,
}) {
  return (
    <section className="section-card">
      <SectionHeader
        eyebrow="Evaluations"
        title="Evaluations"
        actions={
          <div className="toolbar-group">
            <div className="segmented-control" role="tablist" aria-label="Evaluation filter">
              {[
                ['all', 'All'],
                ['active', 'Active'],
                ['dq', 'Disqualified'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`segmented-control__button${evaluationFilter === value ? ' is-active' : ''}`}
                  onClick={() => {
                    setEvaluationFilter(value)
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <label className="field">
              <span className="field__label">Search</span>
              <input
                className="field__input"
                type="search"
                value={evaluationQuery}
                onChange={(event) => {
                  setEvaluationQuery(event.target.value)
                }}
                placeholder="UID, image, hotkey, digest"
              />
            </label>
          </div>
        }
      />

      <div className="two-column-layout two-column-layout--wide-right">
        <article className="panel-card">
          <div className="panel-card__header">
            <h3>Latest records</h3>
            <span className="panel-card__meta">{formatInteger(filteredEvaluations.length)} shown</span>
          </div>

          {evaluationsResource.loading && evaluations.length === 0 ? (
            <TableEmptyState message="Loading evaluation records…" />
          ) : filteredEvaluations.length === 0 ? (
            <TableEmptyState
              message={evaluationsResource.error || 'No evaluations match the current filter.'}
            />
          ) : (
            <div className="table-wrapper table-wrapper--selectable">
              <table>
                <thead>
                  <tr>
                    <th>UID</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Match</th>
                    <th>Image</th>
                    <th>Block</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvaluations.map((evaluation) => (
                    <tr
                      key={`${evaluation.uid}-${evaluation.evaluation_block}`}
                      className={evaluation.uid === selectedEvaluationUid ? 'is-selected-row' : ''}
                      onClick={() => {
                        setSelectedEvaluationUid(evaluation.uid)
                      }}
                    >
                      <td>{`UID ${evaluation.uid}`}</td>
                      <td>
                        <StatusBadge tone={getStatusTone(evaluation.disqualified)}>
                          {evaluation.disqualified ? 'DQ' : 'Active'}
                        </StatusBadge>
                      </td>
                      <td>{formatMetric(evaluation.score, 6)}</td>
                      <td>{formatPercent(evaluation.token_match_rate)}</td>
                      <td><DockerImageLink image={evaluation.image} truncate={true} prefix={20} suffix={14} /></td>
                      <td>{formatInteger(evaluation.evaluation_block)}</td>
                      <td>{formatCompactDateTime(evaluation.evaluated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="panel-card">
          <div className="panel-card__header">
            <h3>
              {selectedEvaluationUid !== null
                ? `UID ${selectedEvaluationUid} history`
                : 'Evaluation history'}
            </h3>
            <span className="panel-card__meta">{formatInteger(evaluationHistory.length)} runs</span>
          </div>

          {evaluationHistoryResource.loading && evaluationHistory.length === 0 ? (
            <TableEmptyState message="Loading UID history…" />
          ) : evaluationHistory.length === 0 ? (
            <TableEmptyState
              message={
                evaluationHistoryResource.error || 'Select an evaluation row to inspect a UID.'
              }
            />
          ) : (
            <>
              <div className="detail-metrics-grid">
                <MetricCard
                  label="Latest score"
                  value={formatMetric(latestSelectedEvaluation?.score, 6)}
                  caption={formatDateTime(latestSelectedEvaluation?.evaluated_at)}
                  tone="accent"
                />
                <MetricCard
                  label="Best score"
                  value={formatMetric(bestScore, 6)}
                  caption="Best result for this UID."
                />
                <MetricCard
                  label="Disqualifications"
                  value={formatInteger(disqualifiedCount)}
                  caption="Total disqualified runs in the selected UID history."
                  tone={disqualifiedCount > 0 ? 'danger' : 'success'}
                />
              </div>

              <div className="subsection-block">
                <div className="subsection-block__header">
                  <h4>Latest run</h4>
                  <span><DockerImageLink image={latestSelectedEvaluation?.image} /></span>
                </div>

                <dl className="definition-grid definition-grid--compact">
                  <div>
                    <dt>Hotkey</dt>
                    <dd>
                      {latestSelectedEvaluation?.hotkey ? (
                        <CopyValueButton
                          value={latestSelectedEvaluation.hotkey}
                          label={`evaluation-hotkey-${latestSelectedEvaluation.uid}`}
                          copiedKey={copiedKey}
                          onCopy={onCopy}
                        />
                      ) : (
                        'Not available'
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Digest</dt>
                    <dd>{truncateMiddle(latestSelectedEvaluation?.digest, 18, 12)}</dd>
                  </div>
                  <div>
                    <dt>Match rate</dt>
                    <dd>{formatPercent(latestSelectedEvaluation?.token_match_rate)}</dd>
                  </div>
                  <div>
                    <dt>Throughput improvement</dt>
                    <dd>{formatMetric(latestSelectedEvaluation?.throughput_improvement, 6)}</dd>
                  </div>
                  <div>
                    <dt>TTFT improvement</dt>
                    <dd>{formatMetric(latestSelectedEvaluation?.ttft_improvement, 6)}</dd>
                  </div>
                  <div>
                    <dt>Disqualify reason</dt>
                    <dd>{latestSelectedEvaluation?.disqualify_reason || 'None'}</dd>
                  </div>
                </dl>
              </div>

              <div className="subsection-block">
                <div className="subsection-block__header">
                  <h4>Per-prompt metrics</h4>
                  <span>{formatInteger(latestSelectedEvaluation?.per_prompt?.length)} prompts</span>
                </div>

                {latestSelectedEvaluation?.per_prompt?.length ? (
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Prompt</th>
                          <th>Output tokens</th>
                          <th>Throughput TPS</th>
                          <th>Match rate</th>
                          <th>TTFT (s)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {latestSelectedEvaluation.per_prompt.map((prompt, index) => (
                          <tr key={`prompt-${index + 1}`}>
                            <td>{index + 1}</td>
                            <td>{formatInteger(prompt.output_tokens)}</td>
                            <td>{formatMetric(prompt.throughput_tps, 3)}</td>
                            <td>{formatPercent(prompt.token_match_rate)}</td>
                            <td>{formatMetric(prompt.ttft_s, 3)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <TableEmptyState message="No prompt-level metrics available for this run." />
                )}
              </div>

              <div className="subsection-block">
                <div className="subsection-block__header">
                  <h4>UID history</h4>
                  <span>Newest first</span>
                </div>

                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Block</th>
                        <th>Status</th>
                        <th>Score</th>
                        <th>Match</th>
                        <th>Throughput</th>
                        <th>TTFT</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evaluationHistory.map((entry) => (
                        <tr key={`${entry.uid}-${entry.evaluation_block}`}>
                          <td>{formatInteger(entry.evaluation_block)}</td>
                          <td>
                            <StatusBadge tone={getStatusTone(entry.disqualified)}>
                              {entry.disqualified ? 'DQ' : 'Active'}
                            </StatusBadge>
                          </td>
                          <td>{formatMetric(entry.score, 6)}</td>
                          <td>{formatPercent(entry.token_match_rate)}</td>
                          <td>{formatMetric(entry.throughput_improvement, 6)}</td>
                          <td>{formatMetric(entry.ttft_improvement, 6)}</td>
                          <td>{formatCompactDateTime(entry.evaluated_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </article>
      </div>
    </section>
  )
}

function LogsPage({
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

function RoundsPage({ pendingEvalJob, evalJobResource, rounds, roundsResource, copiedKey, onCopy }) {
  return (
    <section className="section-card">
      <SectionHeader eyebrow="Rounds" title="Rounds" />

      <div className="two-column-layout">
        <article className="panel-card">
          <div className="panel-card__header">
            <h3>Pending eval job</h3>
            <span className="panel-card__meta">
              {pendingEvalJob ? `Block ${formatInteger(pendingEvalJob.block)}` : 'No pending job'}
            </span>
          </div>

          {!pendingEvalJob ? (
            <TableEmptyState message={evalJobResource.error || 'No pending evaluation job found.'} />
          ) : (
            <>
              <dl className="definition-grid definition-grid--compact">
                <div>
                  <dt>Block hash</dt>
                  <dd>{truncateMiddle(pendingEvalJob.block_hash, 18, 12)}</dd>
                </div>
                <div>
                  <dt>Created at</dt>
                  <dd>{formatDateTime(pendingEvalJob.created_at)}</dd>
                </div>
              </dl>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>UID</th>
                      <th>Hotkey</th>
                      <th>Commit block</th>
                      <th>Image</th>
                      <th>Digest</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingEvalJob.challengers?.map((challenger) => (
                      <tr key={`${challenger.uid}-${challenger.commit_block}`}>
                        <td>{`UID ${challenger.uid}`}</td>
                        <td>
                          <CopyValueButton
                            value={challenger.hotkey}
                            label={`pending-hotkey-${challenger.uid}-${challenger.commit_block}`}
                            copiedKey={copiedKey}
                            onCopy={onCopy}
                          />
                        </td>
                        <td>{formatInteger(challenger.commit_block)}</td>
                        <td><DockerImageLink image={challenger.image} truncate={true} prefix={20} suffix={16} /></td>
                        <td>{truncateMiddle(challenger.digest, 18, 12)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </article>

        <article className="panel-card">
          <div className="panel-card__header">
            <h3>Recent rounds</h3>
            <span className="panel-card__meta">{formatInteger(rounds.length)} rounds</span>
          </div>

          {roundsResource.loading && rounds.length === 0 ? (
            <TableEmptyState message="Loading evaluation rounds…" />
          ) : rounds.length === 0 ? (
            <TableEmptyState message={roundsResource.error || 'No round history available.'} />
          ) : (
            <div className="round-list">
              {rounds.map((round, index) => {
                const disqualified = round.challengers.filter((entry) => entry.disqualified).length
                const active = round.challengers.length - disqualified

                return (
                  <details key={round.evaluation_block} className="round-card" open={index === 0}>
                    <summary className="round-card__summary">
                      <div>
                        <strong>{`Block ${formatInteger(round.evaluation_block)}`}</strong>
                        <span>{formatDateTime(round.evaluated_at)}</span>
                      </div>
                      <div className="round-card__meta">
                        <StatusBadge tone="success">{formatInteger(active)} active</StatusBadge>
                        <StatusBadge tone="danger">{formatInteger(disqualified)} dq</StatusBadge>
                      </div>
                    </summary>

                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>UID</th>
                            <th>Status</th>
                            <th>Score</th>
                            <th>Hotkey</th>
                            <th>Image</th>
                            <th>Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {round.challengers.map((challenger) => (
                            <tr key={`${round.evaluation_block}-${challenger.uid}`}>
                              <td>{`UID ${challenger.uid}`}</td>
                              <td>
                                <StatusBadge tone={getStatusTone(challenger.disqualified)}>
                                  {challenger.disqualified ? 'DQ' : 'Active'}
                                </StatusBadge>
                              </td>
                              <td>{formatMetric(challenger.score, 6)}</td>
                              <td>
                                <CopyValueButton
                                  value={challenger.hotkey}
                                  label={`round-hotkey-${round.evaluation_block}-${challenger.uid}`}
                                  copiedKey={copiedKey}
                                  onCopy={onCopy}
                                />
                              </td>
                              <td><DockerImageLink image={challenger.image} truncate={true} prefix={18} suffix={12} /></td>
                              <td>{challenger.disqualify_reason || 'Passed'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )
              })}
            </div>
          )}
        </article>
      </div>
    </section>
  )
}

function App() {
  const apiBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL)
  const [theme, setTheme] = useState(getInitialTheme)
  const [healthResource, setHealthResource] = useState(createResourceState)
  const [statusResource, setStatusResource] = useState(createResourceState)
  const [kingResource, setKingResource] = useState(createResourceState)
  const [kingHistoryResource, setKingHistoryResource] = useState(createResourceState)
  const [evaluationsResource, setEvaluationsResource] = useState(createResourceState)
  const [evaluationHistoryResource, setEvaluationHistoryResource] = useState(createResourceState)
  const [logsResource, setLogsResource] = useState(createResourceState)
  const [logTextResource, setLogTextResource] = useState(createResourceState)
  const [roundsResource, setRoundsResource] = useState(createResourceState)
  const [evalJobResource, setEvalJobResource] = useState(createResourceState)
  const [evaluationFilter, setEvaluationFilter] = useState('all')
  const [evaluationQuery, setEvaluationQuery] = useState('')
  const [logQuery, setLogQuery] = useState('')
  const [selectedEvaluationUid, setSelectedEvaluationUid] = useState(null)
  const [selectedLogLabel, setSelectedLogLabel] = useState('')
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null)
  const [isRefreshingAll, setIsRefreshingAll] = useState(false)
  const [copiedKey, setCopiedKey] = useState('')

  const deferredEvaluationQuery = useDeferredValue(evaluationQuery)
  const deferredLogQuery = useDeferredValue(logQuery)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  async function copyToClipboard(value, key) {
    if (!value || !navigator.clipboard?.writeText) {
      return
    }

    try {
      await navigator.clipboard.writeText(value)
      setCopiedKey(key)
      window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? '' : current))
      }, 1400)
    } catch {
      setCopiedKey('')
    }
  }

  function getApiLink(path) {
    if (apiBaseUrl) {
      return `${apiBaseUrl}${path}`
    }

    if (typeof window !== 'undefined') {
      return new URL(path, window.location.origin).toString()
    }

    return path
  }

  async function updateResource(setter, path, parser = 'json') {
    setter((current) => ({
      ...current,
      error: '',
      loading: current.data === null,
      refreshing: current.data !== null,
    }))

    try {
      const data = await fetchResource(apiBaseUrl, path, parser)
      setter({ data, error: '', loading: false, refreshing: false })
      return data
    } catch (error) {
      setter((current) => ({
        ...current,
        error: error instanceof Error ? error.message : 'Unable to load data',
        loading: false,
        refreshing: false,
      }))
      return null
    }
  }

  async function loadEvaluationHistory(uid) {
    if (uid === null || uid === undefined || uid === '') {
      setEvaluationHistoryResource(createResourceState())
      return
    }

    await updateResource(setEvaluationHistoryResource, `/api/evaluations/${uid}`)
  }

  async function loadLogText(label) {
    if (!label) {
      setLogTextResource(createResourceState())
      return
    }

    await updateResource(
      setLogTextResource,
      `/api/container-log/${encodeURIComponent(label)}`,
      'text',
    )
  }

  async function loadEvaluations() {
    const path =
      evaluationFilter === 'all'
        ? '/api/evaluations'
        : `/api/evaluations?status=${encodeURIComponent(evaluationFilter)}`

    return updateResource(setEvaluationsResource, path)
  }

  async function refreshAll() {
    setIsRefreshingAll(true)

    try {
      await Promise.all([
        updateResource(setHealthResource, '/api/health'),
        updateResource(setStatusResource, '/api/status'),
        updateResource(setKingResource, '/api/king'),
        updateResource(setKingHistoryResource, '/api/king/history'),
        loadEvaluations(),
        updateResource(setLogsResource, '/api/container-logs'),
        updateResource(setRoundsResource, '/api/rounds'),
        updateResource(setEvalJobResource, '/api/eval-job'),
      ])
      setLastUpdatedAt(Date.now())
    } finally {
      setIsRefreshingAll(false)
    }
  }

  const refreshAllEffect = useEffectEvent(() => {
    void refreshAll()
  })

  const syncEvaluationHistoryEffect = useEffectEvent(() => {
    void loadEvaluationHistory(selectedEvaluationUid)
  })

  const syncLogTextEffect = useEffectEvent(() => {
    void loadLogText(selectedLogLabel)
  })

  useEffect(() => {
    refreshAllEffect()

    const intervalId = window.setInterval(() => {
      refreshAllEffect()
    }, AUTO_REFRESH_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [apiBaseUrl, evaluationFilter])

  useEffect(() => {
    const nextUid = evaluationsResource.data?.evaluations?.[0]?.uid
    const hasCurrentUid = evaluationsResource.data?.evaluations?.some(
      (evaluation) => evaluation.uid === selectedEvaluationUid,
    )

    if (selectedEvaluationUid === null || !hasCurrentUid) {
      setSelectedEvaluationUid(nextUid ?? null)
    }
  }, [evaluationsResource.data, selectedEvaluationUid])

  useEffect(() => {
    const nextLabel = logsResource.data?.logs?.[0]?.label
    const hasCurrentLabel = logsResource.data?.logs?.some(
      (entry) => entry.label === selectedLogLabel,
    )

    if (!selectedLogLabel || !hasCurrentLabel) {
      setSelectedLogLabel(nextLabel ?? '')
    }
  }, [logsResource.data, selectedLogLabel])

  useEffect(() => {
    syncEvaluationHistoryEffect()
  }, [apiBaseUrl, selectedEvaluationUid])

  useEffect(() => {
    syncLogTextEffect()
  }, [apiBaseUrl, selectedLogLabel])

  const status = statusResource.data
  const king = kingResource.data?.king
  const kingHistory = kingHistoryResource.data?.history ?? []
  const evaluations = evaluationsResource.data?.evaluations ?? []
  const evaluationHistory = evaluationHistoryResource.data?.evaluations ?? []
  const latestSelectedEvaluation = evaluationHistory[0]
  const logEntries = logsResource.data?.logs ?? []
  const rounds = roundsResource.data?.rounds ?? []
  const pendingEvalJob = evalJobResource.data?.eval_job

  const normalizedEvaluationQuery = deferredEvaluationQuery.trim().toLowerCase()
  const filteredEvaluations = evaluations.filter((evaluation) => {
    if (!normalizedEvaluationQuery) {
      return true
    }

    const haystack = [
      String(evaluation.uid),
      evaluation.hotkey,
      evaluation.image,
      String(evaluation.evaluation_block),
      evaluation.digest,
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalizedEvaluationQuery)
  })

  const normalizedLogQuery = deferredLogQuery.trim().toLowerCase()
  const filteredLogs = logEntries.filter((entry) => {
    if (!normalizedLogQuery) {
      return true
    }

    const haystack = `${entry.label} ${entry.filename}`.toLowerCase()
    return haystack.includes(normalizedLogQuery)
  })

  const disqualifiedCount = evaluationHistory.filter((entry) => entry.disqualified).length
  const bestScore = evaluationHistory.reduce((highest, entry) => {
    if (highest === null || entry.score > highest) {
      return entry.score
    }

    return highest
  }, null)

  return (
    <main className="dashboard-app">
      <header className="app-header">
        <div className="app-header__inner">
          <div className="app-header__top">
            <div className="app-header__brand">
              <img src="https://cacheon.ai/icon-192.png" alt="" className="brand-mark" />
              <h1 className="visually-hidden">SN14 Validator Dashboard</h1>
            </div>

            <nav className="app-nav" aria-label="Dashboard pages">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `app-nav__link${isActive ? ' app-nav__link--active' : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="app-header__actions">
              <div className="status-strip">
                <span className="status-pill status-pill--minimal" title={`Last updated: ${lastUpdatedAt ? formatDateTime(lastUpdatedAt / 1000) : 'Loading'}`}>
                  {healthResource.error ? '🔴 API Error' : '🟢 API Live'}
                </span>
              </div>
              <button
                type="button"
                className="button theme-toggle"
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                onClick={() => {
                  setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
                }}
              >
                <ThemeToggleIcon theme={theme} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route
          path="/overview"
          element={<OverviewPage healthResource={healthResource} status={status} />}
        />
        <Route
          path="/king"
          element={
            <KingPage
              king={king}
              kingHistory={kingHistory}
              kingHistoryResource={kingHistoryResource}
              copiedKey={copiedKey}
              onCopy={copyToClipboard}
            />
          }
        />
        <Route
          path="/evaluations"
          element={
            <EvaluationsPage
              evaluationFilter={evaluationFilter}
              setEvaluationFilter={setEvaluationFilter}
              evaluationQuery={evaluationQuery}
              setEvaluationQuery={setEvaluationQuery}
              filteredEvaluations={filteredEvaluations}
              evaluations={evaluations}
              evaluationsResource={evaluationsResource}
              selectedEvaluationUid={selectedEvaluationUid}
              setSelectedEvaluationUid={setSelectedEvaluationUid}
              evaluationHistoryResource={evaluationHistoryResource}
              evaluationHistory={evaluationHistory}
              latestSelectedEvaluation={latestSelectedEvaluation}
              bestScore={bestScore}
              disqualifiedCount={disqualifiedCount}
              copiedKey={copiedKey}
              onCopy={copyToClipboard}
            />
          }
        />
        <Route
          path="/logs"
          element={
            <LogsPage
              apiBaseUrl={apiBaseUrl}
              logQuery={logQuery}
              setLogQuery={setLogQuery}
              selectedLogLabel={selectedLogLabel}
              setSelectedLogLabel={setSelectedLogLabel}
              filteredLogs={filteredLogs}
              logEntries={logEntries}
              logsResource={logsResource}
              logTextResource={logTextResource}
              loadLogText={loadLogText}
              copiedKey={copiedKey}
              onCopy={copyToClipboard}
              getApiLink={getApiLink}
            />
          }
        />
        <Route
          path="/rounds"
          element={
            <RoundsPage
              pendingEvalJob={pendingEvalJob}
              evalJobResource={evalJobResource}
              rounds={rounds}
              roundsResource={roundsResource}
              copiedKey={copiedKey}
              onCopy={copyToClipboard}
            />
          }
        />
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>
      </div>

      <Analytics />

      <footer className="app-footer">
        <div className="app-footer__inner">
          <div className="app-footer__header">
            <div>
              <p className="section-header__eyebrow">Links</p>
              <h2>Cacheon</h2>
            </div>
            <div className="app-footer__branding">
               <span>SN14 Validator Dashboard &copy; 2026</span>
            </div>
          </div>

          <div className="link-grid">
            {FOOTER_LINKS.map((link) => (
              <FooterLinkCard key={link.href} {...link} />
            ))}
          </div>
        </div>
      </footer>
    </main>
  )
}

export default App
