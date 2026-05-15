export function ThemeToggleIcon({
  theme
}) {
  if (theme === 'dark') {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className="theme-toggle__icon">
        <circle cx="12" cy="12" r="4.25" fill="currentColor" />
        <path d="M12 1.75v3.1M12 19.15v3.1M4.75 4.75l2.2 2.2M17.05 17.05l2.2 2.2M1.75 12h3.1M19.15 12h3.1M4.75 19.25l2.2-2.2M17.05 6.95l2.2-2.2" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="theme-toggle__icon">
      <path d="M14.5 2.4a8.8 8.8 0 1 0 7.1 13.98A9.7 9.7 0 0 1 14.5 2.4Z" fill="currentColor" />
    </svg>;
}
