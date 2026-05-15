export function LinkIcon({
  type
}) {
  if (type === 'docs') {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className="link-card__icon-svg">
        <path d="M6 4.5h9l3 3V19a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5 19V6A1.5 1.5 0 0 1 6.5 4.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M15 4.5V8h3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>;
  }
  if (type === 'github') {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className="link-card__icon-svg">
        <path d="M12 2.5a9.5 9.5 0 0 0-3 18.52c.47.08.64-.2.64-.46v-1.6c-2.62.57-3.17-1.12-3.17-1.12-.43-1.07-1.05-1.35-1.05-1.35-.86-.58.06-.57.06-.57.95.07 1.46.96 1.46.96.85 1.43 2.22 1.02 2.77.78.08-.6.33-1.02.6-1.26-2.09-.23-4.29-1.03-4.29-4.58 0-1.01.37-1.83.98-2.48-.1-.23-.42-1.16.09-2.41 0 0 .8-.25 2.62.95A9.2 9.2 0 0 1 12 7.75c.81 0 1.62.11 2.38.33 1.82-1.2 2.62-.95 2.62-.95.51 1.25.19 2.18.09 2.41.61.65.98 1.47.98 2.48 0 3.56-2.2 4.35-4.31 4.58.34.29.65.86.65 1.73v2.23c0 .26.17.54.65.45A9.5 9.5 0 0 0 12 2.5Z" fill="currentColor" />
      </svg>;
  }
  if (type === 'x') {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className="link-card__icon-svg">
        <path d="M5 4.5h3.6l4.18 5.6 4.92-5.6H19l-5.5 6.23L19.5 19.5h-3.6l-4.5-6.04-5.31 6.04H4.5l5.95-6.75L5 4.5Z" fill="currentColor" />
      </svg>;
  }
  if (type === 'tao') {
    return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" className="link-card__icon-svg">
        <path fill="currentColor" d="M16.735 4.273v1.61H5.229v-1.61h11.506Zm-6.712 0h1.716v11.61c0 .531.064.921.192 1.17.134.244.307.4.518.47.21.064.428.096.652.096.236 0 .463-.041.68-.124.224-.083.416-.18.576-.288l.46 1.38c-.383.276-.754.454-1.112.538-.358.09-.716.134-1.074.134-.85 0-1.499-.265-1.946-.796-.441-.53-.662-1.387-.662-2.57V4.273Z"></path>
      </svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="link-card__icon-svg">
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.75 12h16.5M12 3.75a13 13 0 0 1 0 16.5M12 3.75a13 13 0 0 0 0 16.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>;
}
