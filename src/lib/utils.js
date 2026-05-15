import { DEFAULT_API_BASE_URL, THEME_STORAGE_KEY } from './constants.js';

export function normalizeBaseUrl(value) {
  return (value || DEFAULT_API_BASE_URL).replace(/\/$/, '')
}

export function createResourceState() {
  return {
    data: null,
    error: '',
    loading: false,
    refreshing: false,
  }
}

export function getInitialTheme() {
  if (typeof window === 'undefined') {
    return 'dark'
  }

  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme
  }

  return 'dark'
}

export async function fetchResource(baseUrl, path, parser = 'json') {
  const response = await fetch(`${baseUrl}${path}`)

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  if (parser === 'text') {
    return response.text()
  }

  return response.json()
}

export function formatDateTime(value) {
  if (value === null || value === undefined) {
    return 'Unknown'
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value * 1000))
}

export function formatCompactDateTime(value) {
  if (!value) {
    return 'Pending'
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value * 1000))
}

export function formatInteger(value) {
  if (value === null || value === undefined) {
    return '0'
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatMetric(value, digits = 3) {
  if (value === null || value === undefined) {
    return 'Not available'
  }

  if (Math.abs(value) >= 1_000) {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  }

  if (Math.abs(value) >= 1) {
    return value.toFixed(Math.min(digits, 2))
  }

  return value.toFixed(digits)
}

export function formatPercent(value) {
  if (value === null || value === undefined) {
    return 'Not available'
  }

  return `${(value * 100).toFixed(1)}%`
}

export function formatMinutes(value) {
  if (value === null || value === undefined) {
    return 'Unknown'
  }

  if (value < 1) {
    return 'Just now'
  }

  if (value < 60) {
    return `${Math.round(value)} min ago`
  }

  const hours = value / 60
  if (hours < 24) {
    return `${hours.toFixed(1)} h ago`
  }

  return `${(hours / 24).toFixed(1)} d ago`
}

export function truncateMiddle(value, prefix = 10, suffix = 8) {
  if (!value || value.length <= prefix + suffix + 1) {
    return value || 'Not available'
  }

  return `${value.slice(0, prefix)}...${value.slice(-suffix)}`
}