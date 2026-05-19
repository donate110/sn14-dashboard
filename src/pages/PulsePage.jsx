import { SectionHeader, TableEmptyState, DockerImageLink, CopyValueButton, StatusBadge, MetricCard } from '../components/index.jsx';
import { formatDateTime, formatInteger, formatMinutes, formatMetric, truncateMiddle } from '../lib/utils.js';

export function PulsePage({ evalProgressResource, pendingEvalJob, evalJobResource }) {
  const progress = evalProgressResource.data;
  const isIdle = !progress || progress.status === 'idle';

  return (
    <section className="section-card">
      <SectionHeader eyebrow="Pulse" title="Live Progress" />

      {evalProgressResource.loading && !progress ? (
        <TableEmptyState message="Loading live progress..." />
      ) : isIdle ? (
        <TableEmptyState message="No live evaluation round actively running right now." />
      ) : (
        <div className="two-column-layout">
          <article className="panel-card">
            <div className="panel-card__header">
              <h3>Current Evaluation ({progress.phase})</h3>
              <StatusBadge tone="accent">{progress.status}</StatusBadge>
            </div>
            
            <dl className="definition-grid definition-grid--compact">
              <div>
                <dt>Evaluation Block</dt>
                <dd>{formatInteger(progress.round_block)}</dd>
              </div>
              <div>
                <dt>Started At</dt>
                <dd>{formatDateTime(progress.started_at)}</dd>
              </div>
              {progress.gpu && (
                <>
                  <div>
                    <dt>GPU Type</dt>
                    <dd>{progress.gpu.num_gpus}x {progress.gpu.gpu_type} ({progress.gpu.provider})</dd>
                  </div>
                  <div>
                    <dt>Pod ID</dt>
                    <dd>{progress.gpu.pod_id}</dd>
                  </div>
                  <div>
                    <dt>GPU Cost</dt>
                    <dd>${formatMetric(progress.gpu.cost_per_hr, 2)} / hr</dd>
                  </div>
                </>
              )}
            </dl>

            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ marginBottom: '1rem' }}>Timeline</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {progress.steps?.map((step, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', padding: '0.5rem', backgroundColor: 'var(--surface-color-higher)', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontWeight: 500 }}>{step.phase} {step.step ? `(${step.step})` : ''}</span>
                    <span style={{ color: 'var(--text-color-muted)' }}>{formatDateTime(step.ts)}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="panel-card panel-card--flush">
            <div className="panel-card__header panel-card__header--padded">
              <h3>Participating Challengers</h3>
              <span className="panel-card__meta">{formatInteger(progress.challengers?.length)} total</span>
            </div>
            
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>UID</th>
                    <th>Status</th>
                    <th>Image</th>
                  </tr>
                </thead>
                <tbody>
                  {progress.challengers?.map((c) => (
                    <tr key={c.uid} className={c.status === 'running' ? 'row--highlight' : ''}>
                      <td>UID {c.uid}</td>
                      <td>
                        <StatusBadge tone={c.status === 'completed' ? 'success' : c.status === 'failed' ? 'danger' : c.status === 'running' ? 'accent' : 'default'}>
                          {c.status}
                        </StatusBadge>
                      </td>
                      <td><DockerImageLink image={c.image} truncate={true} prefix={20} suffix={16} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      )}
    </section>
  )
}
