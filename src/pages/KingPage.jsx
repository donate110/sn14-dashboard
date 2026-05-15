import { MetricCard, SectionHeader, TableEmptyState, DockerImageLink, CopyValueButton, StatusBadge } from '../components/index.jsx';
import { formatInteger, formatDateTime, formatCompactDateTime, formatPercent, formatMetric } from '../lib/utils.js';

export function KingPage({ king, kingHistory, kingHistoryResource, copiedKey, onCopy }) {
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