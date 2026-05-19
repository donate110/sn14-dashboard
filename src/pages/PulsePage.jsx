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

            <div className="timeline-container">
              <h4 className="section-header__eyebrow" style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Timeline Progress</h4>
              <div className="timeline">
                {progress.steps?.map((step, i) => {
                  const isLast = i === progress.steps.length - 1;
                  return (
                    <div key={i} className={`timeline-item ${isLast ? 'timeline-item--active' : ''}`}>
                      <div className="timeline-item-title">
                        {step.phase} {step.step ? <span style={{color: 'var(--color-text-muted)', fontWeight: 500}}>({step.step})</span> : ''}
                      </div>
                      <time className="timeline-item-ts">{formatDateTime(step.ts)}</time>
                    </div>
                  );
                })}
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
