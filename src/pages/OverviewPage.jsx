import { MetricCard, SectionHeader, StatusBadge, getStatusTone, LinkIcon, DockerImageLink } from '../components/index.jsx';
import { formatInteger, formatDateTime, formatPercent, formatMinutes } from '../lib/utils.js';

export function OverviewPage({ healthResource, status }) {
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