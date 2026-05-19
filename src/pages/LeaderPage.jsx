import { MetricCard, SectionHeader, TableEmptyState, DockerImageLink, CopyValueButton, StatusBadge } from '../components/index.jsx';
import { formatInteger, formatDateTime, formatCompactDateTime, formatPercent, formatMetric } from '../lib/utils.js';

export function LeaderPage({ leader, leaderHistory, leaderHistoryResource, copiedKey, onCopy }) {
  return (
    <section className="section-card">
      <SectionHeader eyebrow="Leader" title="Leader" />

      <div className="two-column-layout">
        <article className="spotlight-card">
          <div className="spotlight-card__header">
            <div>
              <span className="spotlight-card__eyebrow">Current leader</span>
              <h3>{leader ? `UID ${leader.uid}` : 'Waiting for leader data'}</h3>
            </div>
            <StatusBadge tone="accent">Score {formatMetric(leader?.score, 6)}</StatusBadge>
          </div>

          <dl className="definition-grid">
            <div>
              <dt>Image</dt>
              <dd><DockerImageLink image={leader?.image} /></dd>
            </div>
            <div>
              <dt>Hotkey</dt>
              <dd>
                {leader?.hotkey ? (
                  <CopyValueButton
                    value={leader.hotkey}
                    label={`leader-hotkey-${leader.uid}`}
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
              <dd>{formatInteger(leader?.evaluation_block)}</dd>
            </div>
            <div>
              <dt>Commit block</dt>
              <dd>{formatInteger(leader?.commit_block)}</dd>
            </div>
            <div>
              <dt>Token match rate</dt>
              <dd>{formatPercent(leader?.token_match_rate)}</dd>
            </div>
            <div>
              <dt>Throughput improvement</dt>
              <dd>{formatMetric(leader?.throughput_improvement, 6)}</dd>
            </div>
            <div>
              <dt>TTFT improvement</dt>
              <dd>{formatMetric(leader?.ttft_improvement, 6)}</dd>
            </div>
            <div>
              <dt>Evaluated at</dt>
              <dd>{formatDateTime(leader?.evaluated_at)}</dd>
            </div>
          </dl>
        </article>

        <article className="panel-card">
          <div className="panel-card__header">
            <h3>History</h3>
            <span className="panel-card__meta">{formatInteger(leaderHistoryResource.data?.total)} entries</span>
          </div>

          {leaderHistory.length === 0 ? (
            <TableEmptyState message={leaderHistoryResource.error || 'No dethronement history found.'} />
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Block</th>
                    <th>New leader</th>
                    <th>Score</th>
                    <th>Image</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderHistory.map((entry) => (
                    <tr key={`${entry.block}-${entry.new_leader_uid}`}>
                      <td>{formatInteger(entry.block)}</td>
                      <td>{`UID ${entry.new_leader_uid}`}</td>
                      <td>{formatMetric(entry.new_leader_score, 6)}</td>
                      <td><DockerImageLink image={entry.new_leader_image} truncate={true} prefix={20} suffix={16} /></td>
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