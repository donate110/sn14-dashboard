import { truncateMiddle } from '../lib/utils.js';

export function CopyValueButton({
  value,
  label,
  copiedKey,
  onCopy,
  className = ''
}) {
  const isCopied = copiedKey === label;
  return <button type="button" className={`copy-value-button${isCopied ? ' is-copied' : ''}${className ? ` ${className}` : ''}`} onClick={() => {
    onCopy(value, label);
  }} title={`Copy ${label}`}>
      <span>{truncateMiddle(value, 14, 10)}</span>
      <span className="copy-value-button__icon-wrapper">
        {isCopied ? <svg viewBox="0 0 24 24" aria-hidden="true" className="copy-value-button__icon text-success">
            <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg> : <svg viewBox="0 0 24 24" aria-hidden="true" className="copy-value-button__icon">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>}
      </span>
    </button>;
}
