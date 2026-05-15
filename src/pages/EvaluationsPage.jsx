import { SectionHeader, TableEmptyState, StatusBadge, MetricCard, DockerImageLink, getStatusTone, CopyValueButton } from '../components/index.jsx';
import { formatPercent, formatInteger, formatMetric, formatDateTime, formatCompactDateTime, truncateMiddle } from '../lib/utils.js';

export function EvaluationsPage({
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