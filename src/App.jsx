import { useDeferredValue, useEffect, useEffectEvent, useState } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { Analytics } from "@vercel/analytics/react"
import { AUTO_REFRESH_MS, NAV_ITEMS, FOOTER_LINKS, THEME_STORAGE_KEY } from './lib/constants.js'
import { normalizeBaseUrl, createResourceState, getInitialTheme, fetchResource, formatDateTime } from './lib/utils.js'
import { ThemeToggleIcon, FooterLinkCard } from './components/index.jsx'
import { OverviewPage } from './pages/OverviewPage.jsx'
import { LeaderPage } from './pages/LeaderPage.jsx'
import { EvaluationsPage } from './pages/EvaluationsPage.jsx'
import { LogsPage } from './pages/LogsPage.jsx'
import { RoundsPage } from './pages/RoundsPage.jsx';
import { PulsePage } from './pages/PulsePage.jsx'
import './App.css'


export default function App() {
  const apiBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL)
  const [theme, setTheme] = useState(getInitialTheme)
  const [healthResource, setHealthResource] = useState(createResourceState)
  const [statusResource, setStatusResource] = useState(createResourceState)
  const [leaderResource, setLeaderResource] = useState(createResourceState)
  const [leaderHistoryResource, setLeaderHistoryResource] = useState(createResourceState)
  const [evaluationsResource, setEvaluationsResource] = useState(createResourceState)
  const [evaluationHistoryResource, setEvaluationHistoryResource] = useState(createResourceState)
  const [logsResource, setLogsResource] = useState(createResourceState)
  const [logTextResource, setLogTextResource] = useState(createResourceState)
  const [validatorLogTextResource, setValidatorLogTextResource] = useState(createResourceState)
  const [roundsResource, setRoundsResource] = useState(createResourceState)
  const [evalJobResource, setEvalJobResource] = useState(createResourceState)
  const [evalProgressResource, setEvalProgressResource] = useState(createResourceState)
  const [evaluationFilter, setEvaluationFilter] = useState('all')
  const [evaluationQuery, setEvaluationQuery] = useState('')
  const [logQuery, setLogQuery] = useState('')
  const [validatorLogQuery, setValidatorLogQuery] = useState('')
  const [selectedEvaluationUid, setSelectedEvaluationUid] = useState(null)
  const [selectedLogLabel, setSelectedLogLabel] = useState('')
  const [selectedValidatorLogLabel, setSelectedValidatorLogLabel] = useState('')
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null)
  const [isRefreshingAll, setIsRefreshingAll] = useState(false)
  const [copiedKey, setCopiedKey] = useState('')

  const deferredEvaluationQuery = useDeferredValue(evaluationQuery)
  const deferredLogQuery = useDeferredValue(logQuery)
  const deferredValidatorLogQuery = useDeferredValue(validatorLogQuery)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  async function copyToClipboard(value, key) {
    if (!value || !navigator.clipboard?.writeText) {
      return
    }

    try {
      await navigator.clipboard.writeText(value)
      setCopiedKey(key)
      window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? '' : current))
      }, 1400)
    } catch {
      setCopiedKey('')
    }
  }

  function getApiLink(path) {
    if (apiBaseUrl) {
      return `${apiBaseUrl}${path}`
    }

    if (typeof window !== 'undefined') {
      return new URL(path, window.location.origin).toString()
    }

    return path
  }

  async function updateResource(setter, path, parser = 'json') {
    setter((current) => ({
      ...current,
      error: '',
      loading: current.data === null,
      refreshing: current.data !== null,
    }))

    try {
      const data = await fetchResource(apiBaseUrl, path, parser)
      setter({ data, error: '', loading: false, refreshing: false })
      return data
    } catch (error) {
      setter((current) => ({
        ...current,
        error: error instanceof Error ? error.message : 'Unable to load data',
        loading: false,
        refreshing: false,
      }))
      return null
    }
  }

  async function loadEvaluationHistory(uid) {
    if (uid === null || uid === undefined || uid === '') {
      setEvaluationHistoryResource(createResourceState())
      return
    }

    await updateResource(setEvaluationHistoryResource, `/api/evaluations/${uid}`)
  }

  async function loadLogText(label) {
    if (!label) {
      setLogTextResource(createResourceState())
      return
    }

    const isValidatorLog = label.startsWith('cpu_validator_') || label.startsWith('gpu_eval_');
    const endpoint = isValidatorLog ? '/api/validator-log/' : '/api/container-log/';

    await updateResource(
      setLogTextResource,
      `${endpoint}${encodeURIComponent(label)}`,
      'text',
    )
  }

  async function loadValidatorLogText(label) {
    if (!label) {
      setValidatorLogTextResource(createResourceState())
      return
    }

    const isValidatorLog = label.startsWith('cpu_validator_') || label.startsWith('gpu_eval_');
    const endpoint = isValidatorLog ? '/api/validator-log/' : '/api/container-log/';

    await updateResource(
      setValidatorLogTextResource,
      `${endpoint}${encodeURIComponent(label)}`,
      'text',
    )
  }


  async function loadAllLogs() {
    setLogsResource((current) => ({
      ...current,
      error: '',
      loading: current.data === null,
      refreshing: current.data !== null,
    }))
    try {
      const [containerRes, validatorRes] = await Promise.allSettled([
        fetchResource(apiBaseUrl, '/api/container-logs'),
        fetchResource(apiBaseUrl, '/api/validator-logs')
      ]);
      let logs = [];
      let encounteredError = null;
      if (containerRes.status === 'fulfilled' && containerRes.value?.logs) {
         logs.push(...containerRes.value.logs);
      } else if (containerRes.status === 'rejected') {
         encounteredError = containerRes.reason;
      }
      if (validatorRes.status === 'fulfilled' && validatorRes.value?.logs) {
         logs.push(...validatorRes.value.logs);
      } else if (validatorRes.status === 'rejected') {
         encounteredError = validatorRes.reason;
      }
      if (logs.length === 0 && encounteredError) {
         throw encounteredError;
      }
      setLogsResource({ data: { logs }, error: '', loading: false, refreshing: false })
    } catch (error) {
      setLogsResource((current) => ({
        ...current,
        error: error instanceof Error ? error.message : 'Unable to load logs',
        loading: false,
        refreshing: false,
      }))
    }
  }

async function loadEvaluations() {

    const path =
      evaluationFilter === 'all'
        ? '/api/evaluations'
        : `/api/evaluations?status=${encodeURIComponent(evaluationFilter)}`

    return updateResource(setEvaluationsResource, path)
  }

  async function refreshAll() {
    setIsRefreshingAll(true)

    try {
      await Promise.all([
        updateResource(setHealthResource, '/api/health'),
        updateResource(setStatusResource, '/api/status'),
        updateResource(setLeaderResource, '/api/leader'),
        updateResource(setLeaderHistoryResource, '/api/leader/history'),
        loadEvaluations(),
        loadAllLogs(),
        updateResource(setRoundsResource, '/api/rounds'),
        updateResource(setEvalJobResource, '/api/eval-job'),
        updateResource(setEvalProgressResource, '/api/eval-progress'),
      ])
      setLastUpdatedAt(Date.now())
    } finally {
      setIsRefreshingAll(false)
    }
  }

  const refreshAllEffect = useEffectEvent(() => {
    void refreshAll()
  })

  useEffect(() => {
    // pulse-poll-effect
    const interval = setInterval(() => {
      updateResource(setEvalProgressResource, '/api/eval-progress');
    }, 5000);
    return () => clearInterval(interval);
  }, [apiBaseUrl]);

  const syncEvaluationHistoryEffect = useEffectEvent(() => {
    void loadEvaluationHistory(selectedEvaluationUid)
  })

  const syncLogTextEffect = useEffectEvent(() => {
    void loadLogText(selectedLogLabel)
  })

  const syncValidatorLogTextEffect = useEffectEvent(() => {
    void loadValidatorLogText(selectedValidatorLogLabel)
  })

  useEffect(() => {
    refreshAllEffect()

    const intervalId = window.setInterval(() => {
      refreshAllEffect()
    }, AUTO_REFRESH_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [apiBaseUrl, evaluationFilter])

  useEffect(() => {
    const nextUid = evaluationsResource.data?.evaluations?.[0]?.uid
    const hasCurrentUid = evaluationsResource.data?.evaluations?.some(
      (evaluation) => evaluation.uid === selectedEvaluationUid,
    )

    if (selectedEvaluationUid === null || !hasCurrentUid) {
      setSelectedEvaluationUid(nextUid ?? null)
    }
  }, [evaluationsResource.data, selectedEvaluationUid])

  useEffect(() => {
    const minerLogs = logsResource.data?.logs?.filter(e => !e.label.startsWith('cpu_validator_') && !e.label.startsWith('gpu_eval_')) || []
    const nextLabel = minerLogs[0]?.label
    const hasCurrentLabel = minerLogs.some(
      (entry) => entry.label === selectedLogLabel,
    )

    if (!selectedLogLabel || !hasCurrentLabel) {
      setSelectedLogLabel(nextLabel ?? '')
    }
  }, [logsResource.data, selectedLogLabel])

  useEffect(() => {
    const valLogs = logsResource.data?.logs?.filter(e => e.label.startsWith('cpu_validator_') || e.label.startsWith('gpu_eval_')) || []
    const nextLabel = valLogs[0]?.label
    const hasCurrentLabel = valLogs.some(
      (entry) => entry.label === selectedValidatorLogLabel,
    )

    if (!selectedValidatorLogLabel || !hasCurrentLabel) {
      setSelectedValidatorLogLabel(nextLabel ?? '')
    }
  }, [logsResource.data, selectedValidatorLogLabel])

  useEffect(() => {
    syncEvaluationHistoryEffect()
  }, [apiBaseUrl, selectedEvaluationUid])

  useEffect(() => {
    syncLogTextEffect()
  }, [apiBaseUrl, selectedLogLabel])

  useEffect(() => {
    syncValidatorLogTextEffect()
  }, [apiBaseUrl, selectedValidatorLogLabel])

  const status = statusResource.data
  const leader = leaderResource.data?.leader
  const leaderHistory = leaderHistoryResource.data?.history ?? []
  const evaluations = evaluationsResource.data?.evaluations ?? []
  const evaluationHistory = evaluationHistoryResource.data?.evaluations ?? []
  const latestSelectedEvaluation = evaluationHistory[0]
  const logEntries = logsResource.data?.logs ?? []
  const rounds = roundsResource.data?.rounds ?? []
  const pendingEvalJob = evalJobResource.data?.eval_job

  const normalizedEvaluationQuery = deferredEvaluationQuery.trim().toLowerCase()
  const filteredEvaluations = evaluations.filter((evaluation) => {
    if (!normalizedEvaluationQuery) {
      return true
    }

    const haystack = [
      String(evaluation.uid),
      evaluation.hotkey,
      evaluation.image,
      String(evaluation.evaluation_block),
      evaluation.digest,
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalizedEvaluationQuery)
  })

  const normalizedLogQuery = deferredLogQuery.trim().toLowerCase()
  const normalizedValidatorLogQuery = deferredValidatorLogQuery.trim().toLowerCase()

  const minerLogEntries = logEntries.filter(e => !e.label.startsWith('cpu_validator_') && !e.label.startsWith('gpu_eval_'));
  const validatorLogEntries = logEntries.filter(e => e.label.startsWith('cpu_validator_') || e.label.startsWith('gpu_eval_'));

  const filteredLogs = minerLogEntries.filter((entry) => {
    if (!normalizedLogQuery) return true
    const haystack = `${entry.label} ${entry.filename}`.toLowerCase()
    return haystack.includes(normalizedLogQuery)
  })

  const filteredValidatorLogs = validatorLogEntries.filter((entry) => {
    if (!normalizedValidatorLogQuery) return true
    const haystack = `${entry.label} ${entry.filename}`.toLowerCase()
    return haystack.includes(normalizedValidatorLogQuery)
  })

  const disqualifiedCount = evaluationHistory.filter((entry) => entry.disqualified).length
  const bestScore = evaluationHistory.reduce((highest, entry) => {
    if (highest === null || entry.score > highest) {
      return entry.score
    }

    return highest
  }, null)

  return (
    <main className="dashboard-app">
      <header className="app-header">
        <div className="app-header__inner">
          <div className="app-header__top">
            <div className="app-header__brand">
              <img src="https://cacheon.ai/icon-192.png" alt="" className="brand-mark" />
              <h1 className="visually-hidden">SN14 Validator Dashboard</h1>
            </div>

            <nav className="app-nav" aria-label="Dashboard pages">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `app-nav__link${isActive ? ' app-nav__link--active' : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="app-header__actions">
              <div className="status-strip">
                <span className="status-pill status-pill--minimal" title={`Last updated: ${lastUpdatedAt ? formatDateTime(lastUpdatedAt / 1000) : 'Loading'}`}>
                  {healthResource.error ? '🔴 API Error' : '🟢 API Live'}
                </span>
              </div>
              <button
                type="button"
                className="button theme-toggle"
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                onClick={() => {
                  setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
                }}
              >
                <ThemeToggleIcon theme={theme} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="main-content">
        <Routes>
<Route
          path="/pulse"
          element={
            <PulsePage
              evalProgressResource={evalProgressResource}
              pendingEvalJob={pendingEvalJob}
              evalJobResource={evalJobResource}
            />
          }
        />
        
          <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route
          path="/overview"
          element={<OverviewPage healthResource={healthResource} status={status} />}
        />
        <Route
          path="/leader"
          element={
            <LeaderPage
              leader={leader}
              leaderHistory={leaderHistory}
              leaderHistoryResource={leaderHistoryResource}
              copiedKey={copiedKey}
              onCopy={copyToClipboard}
            />
          }
        />
        <Route
          path="/evaluations"
          element={
            <EvaluationsPage
              evaluationFilter={evaluationFilter}
              setEvaluationFilter={setEvaluationFilter}
              evaluationQuery={evaluationQuery}
              setEvaluationQuery={setEvaluationQuery}
              filteredEvaluations={filteredEvaluations}
              evaluations={evaluations}
              evaluationsResource={evaluationsResource}
              selectedEvaluationUid={selectedEvaluationUid}
              setSelectedEvaluationUid={setSelectedEvaluationUid}
              evaluationHistoryResource={evaluationHistoryResource}
              evaluationHistory={evaluationHistory}
              latestSelectedEvaluation={latestSelectedEvaluation}
              bestScore={bestScore}
              disqualifiedCount={disqualifiedCount}
              copiedKey={copiedKey}
              onCopy={copyToClipboard}
            />
          }
        />
        <Route
          path="/logs"
          element={
            <LogsPage
              title="Miner Logs"
              eyebrow="Miner Logs"
              apiBaseUrl={apiBaseUrl}
              logQuery={logQuery}
              setLogQuery={setLogQuery}
              selectedLogLabel={selectedLogLabel}
              setSelectedLogLabel={setSelectedLogLabel}
              filteredLogs={filteredLogs}
              logEntries={logEntries}
              logsResource={logsResource}
              logTextResource={logTextResource}
              loadLogText={loadLogText}
              copiedKey={copiedKey}
              onCopy={copyToClipboard}
              getApiLink={getApiLink}
            />
          }
        />
        <Route
          path="/validator-logs"
          element={
            <LogsPage
              title="Validator Logs"
              eyebrow="Validator Logs"
              isValidatorView={true}
              apiBaseUrl={apiBaseUrl}
              logQuery={validatorLogQuery}
              setLogQuery={setValidatorLogQuery}
              selectedLogLabel={selectedValidatorLogLabel}
              setSelectedLogLabel={setSelectedValidatorLogLabel}
              filteredLogs={filteredValidatorLogs}
              logEntries={logEntries}
              logsResource={logsResource}
              logTextResource={validatorLogTextResource}
              loadLogText={loadValidatorLogText}
              copiedKey={copiedKey}
              onCopy={copyToClipboard}
              getApiLink={getApiLink}
            />
          }
        />
        <Route
          path="/rounds"
          element={
            <RoundsPage
              pendingEvalJob={pendingEvalJob}
              evalJobResource={evalJobResource}
              rounds={rounds}
              roundsResource={roundsResource}
              copiedKey={copiedKey}
              onCopy={copyToClipboard}
            />
          }
        />
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>
      </div>

      <Analytics />

      <footer className="app-footer">
        <div className="app-footer__inner">
          <div className="app-footer__header">
            <div>
              <p className="section-header__eyebrow">Links</p>
              <h2>Cacheon</h2>
            </div>
            <div className="app-footer__branding">
               <span>SN14 Validator Dashboard &copy; 2026</span>
            </div>
          </div>

          <div className="link-grid">
            {FOOTER_LINKS.map((link) => (
              <FooterLinkCard key={link.href} {...link} />
            ))}
          </div>
        </div>
      </footer>
    </main>
  )
}
