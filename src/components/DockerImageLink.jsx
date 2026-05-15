import { truncateMiddle } from '../lib/utils.js';

export function DockerImageLink({
  image,
  truncate = false,
  prefix = 20,
  suffix = 16
}) {
  if (!image) return 'Not available';
  const display = truncate ? truncateMiddle(image, prefix, suffix) : image;
  let href = null;
  if (image.startsWith('docker.io/')) {
    const repo = image.substring(10).split(':')[0];
    href = `https://hub.docker.com/r/${repo}`;
  } else if (image.startsWith('ghcr.io/')) {
    const repo = image.substring(8).split(':')[0];
    href = `https://github.com/${repo}`;
  } else if (image.includes('/') && !image.includes('.')) {
    const repo = image.split(':')[0];
    href = `https://hub.docker.com/r/${repo}`;
  }
  if (href) {
    return <a href={href} target="_blank" rel="noreferrer" className="image-link" title={`View image repository for ${image}`} onClick={e => e.stopPropagation()}>
        {display}
      </a>;
  }
  return <span title={image}>{display}</span>;
}
