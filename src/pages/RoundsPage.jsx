import { SectionHeader, TableEmptyState, DockerImageLink, CopyValueButton, StatusBadge, getStatusTone } from '../components/index.jsx';
import { formatMinutes, truncateMiddle, formatCompactDateTime, formatInteger, formatDateTime, formatMetric } from '../lib/utils.js';

export function RoundsPage({ pendingEvalJob, evalJobResource, rounds, roundsResource, copiedKey, onCopy }) {
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