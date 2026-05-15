import { LinkIcon } from './LinkIcon.jsx';

export function FooterLinkCard({
  label,
  href,
  description,
  icon
}) {
  return <a className="link-card" href={href} target="_blank" rel="noreferrer">
      <span className="link-card__icon">
        <LinkIcon type={icon} />
      </span>
      <span className="link-card__body">
        <strong>{label}</strong>
        <span>{description}</span>
      </span>
    </a>;
}
