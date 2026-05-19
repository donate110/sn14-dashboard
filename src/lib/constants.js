export const DEFAULT_API_BASE_URL = ''
export const AUTO_REFRESH_MS = 60_000
export const THEME_STORAGE_KEY = 'sn14-dashboard-theme'

export const NAV_ITEMS = [
  { to: '/overview', label: 'Overview' },
  { to: '/leader', label: 'Leader' },
  { to: '/evaluations', label: 'Evaluations' },
  { to: '/logs', label: 'Logs' },
  { to: '/rounds', label: 'Rounds' },
]

export const FOOTER_LINKS = [
  {
    label: 'Website',
    href: 'https://cacheon.ai/',
    description: 'cacheon.ai',
    icon: 'globe',
  },
  {
    label: 'Docs',
    href: 'https://cacheon.ai/docs',
    description: 'Project documentation',
    icon: 'docs',
  },
  {
    label: 'GitHub repository',
    href: 'https://github.com/latent-to/cacheon',
    description: 'latent-to/cacheon',
    icon: 'github',
  },
  {
    label: 'X',
    href: 'https://x.com/cacheon_ai',
    description: '@cacheon_ai',
    icon: 'x',
  },
  {
    label: 'TAO.app',
    href: 'https://tao.app/subnets/14',
    description: 'Subnet 14 profile',
    icon: 'tao',
  },
]
