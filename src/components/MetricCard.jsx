export function MetricCard({
  label,
  value,
  caption,
  tone = 'default'
}) {
  return <article className={`metric-card metric-card--${tone}`}>
      <span className="metric-card__label">{label}</span>
      <strong className="metric-card__value">{value}</strong>
      {caption ? <span className="metric-card__caption">{caption}</span> : null}
    </article>;
}
