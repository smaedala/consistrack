import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const START_BALANCE = 100000
const MAX_DRAWDOWN_RULE = 5
const CONSISTENCY_RULE = 40

function formatMoney(value) {
  return Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function dayKey(dateString) {
  if (!dateString) return 'N/A'
  const d = new Date(dateString)
  if (Number.isNaN(d.getTime())) return String(dateString).slice(0, 10)
  return d.toISOString().slice(0, 10)
}

function dayLabel(dateKey) {
  if (!dateKey || dateKey === 'N/A') return 'Unknown'
  const d = new Date(`${dateKey}T00:00:00`)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function getMood(pnl) {
  if (pnl >= 120) return { label: 'Calm', cls: 'calm' }
  if (pnl >= 0) return { label: 'Focused', cls: 'focus' }
  if (pnl <= -120) return { label: 'FOMO', cls: 'fomo' }
  return { label: 'Aggressive', cls: 'stress' }
}

function getStatusFromPct(pct) {
  if (pct >= 100) return { label: 'WARNING (BREACH)', cls: 'danger' }
  if (pct >= 70) return { label: 'WARNING', cls: 'warn' }
  return { label: 'SAFE (PASSING)', cls: 'safe' }
}

function IconGrid() {
  return <svg viewBox="0 0 24 24"><path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" /></svg>
}

function IconMatrix() {
  return <svg viewBox="0 0 24 24"><path d="M3 3h18v18H3V3Zm2 2v4h4V5H5Zm6 0v4h8V5h-8ZM5 11v8h4v-8H5Zm6 0v3h8v-3h-8Zm0 5v3h8v-3h-8Z" /></svg>
}

function IconPsychology() {
  return <svg viewBox="0 0 24 24"><path d="M12 2a8 8 0 0 0-4 14.9V20a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-3.1A8 8 0 0 0 12 2Zm2 17h-4v-1h4v1Zm.2-4.3-.7.4V16h-3v-.9l-.7-.4a5.6 5.6 0 1 1 4.8 0Z" /></svg>
}

function IconRules() {
  return <svg viewBox="0 0 24 24"><path d="M12 2 3 6v6c0 5.2 3.4 9.8 9 12 5.6-2.2 9-6.8 9-12V6l-9-4Zm0 2.2 7 3.1v4.6c0 4.1-2.6 8-7 9.9-4.4-1.9-7-5.8-7-9.9V7.3l7-3.1Z" /></svg>
}

function IconSettings() {
  return <svg viewBox="0 0 24 24"><path d="m12 8.5 2.4-1.4 2 1.1v2.7l-2.4 1.4-2-1.1V8.5Zm0-6.5 2 1.2.4 2.3 2 .8 1.9-1 2 1.2-.1 2.2 1.6 1.4 2.2-.2v2.4l-2.2.6-.9 2 1.1 1.9-1.2 2-2.2-.1-1.4 1.6.2 2.2H12l-.6-2.2-2-.9-1.9 1.1-2-1.2.1-2.2-1.6-1.4-2.2.2V12l2.2-.6.9-2-1.1-1.9 1.2-2 2.2.1 1.4-1.6L8 2h4Z" /></svg>
}

function Sparkline({ points = [] }) {
  if (!points || points.length < 2) return null

  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = Math.max(max - min, 1)

  const line = points.map((value, i) => {
    const x = (i / (points.length - 1)) * 100
    const y = 76 - ((value - min) / range) * 52
    return `${x},${y}`
  }).join(' ')

  return (
    <svg className="elite-spark" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={line} fill="none" stroke="#10B981" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

function EquityChart({ series, selectedDay, onSelectDay }) {
  const ref = useRef(null)
  const [hovered, setHovered] = useState(null)

  const points = useMemo(() => {
    if (!series.length) return []
    const max = Math.max(...series.map((d) => d.balance))
    const min = Math.min(...series.map((d) => d.balance))
    const range = Math.max(max - min, 1)

    return series.map((d, idx) => ({
      ...d,
      x: (idx / Math.max(series.length - 1, 1)) * 100,
      y: 76 - ((d.balance - min) / range) * 54,
    }))
  }, [series])

  const path = points.map((p) => `${p.x},${p.y}`).join(' ')

  function onMove(event) {
    if (!ref.current || !points.length) return
    const rect = ref.current.getBoundingClientRect()
    const rx = ((event.clientX - rect.left) / rect.width) * 100

    let nearest = points[0]
    let dist = Math.abs(points[0].x - rx)

    for (let i = 1; i < points.length; i += 1) {
      const d = Math.abs(points[i].x - rx)
      if (d < dist) {
        dist = d
        nearest = points[i]
      }
    }

    setHovered(nearest)
  }

  return (
    <article className="elite-card elite-chart-card" id="overview-section">
      <h3>Equity Curve</h3>
      <div className="elite-chart-inner" ref={ref} onMouseMove={onMove} onMouseLeave={() => setHovered(null)}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Night-sky equity curve">
          <defs>
            <linearGradient id="eliteFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(0,242,254,0.35)" />
              <stop offset="100%" stopColor="rgba(0,242,254,0.03)" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="100" height="100" fill="#111722" />
          <polyline points="0,20 100,20" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 2" fill="none" />
          <polyline points="0,50 100,50" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 2" fill="none" />
          <polyline points="0,80 100,80" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 2" fill="none" />
          {path ? (
            <>
              <polygon points={`0,100 ${path} 100,100`} fill="url(#eliteFill)" />
              <polyline points={path} fill="none" stroke="#00F2FE" strokeWidth="0.9" strokeLinecap="round" />
            </>
          ) : null}
          {points.map((p) => (
            <circle
              key={p.dayKey}
              cx={p.x}
              cy={p.y}
              r={selectedDay === p.dayKey ? 1.4 : 1}
              className={`elite-pip ${selectedDay === p.dayKey ? 'active' : ''}`}
              onClick={() => onSelectDay(selectedDay === p.dayKey ? null : p.dayKey)}
            />
          ))}
        </svg>
        {hovered ? (
          <div className="elite-tooltip" style={{ left: `${hovered.x}%`, top: `${hovered.y}%` }}>
            <strong>{dayLabel(hovered.dayKey)}</strong>
            <span>Balance: €{formatMoney(hovered.balance)}</span>
            <span>Daily PnL: {hovered.dailyPnl >= 0 ? '+' : ''}{formatMoney(hovered.dailyPnl)}</span>
            <span>Trades: {hovered.totalTrades}</span>
          </div>
        ) : null}
      </div>
      <div className="elite-axis">
        {series.map((d, i) => (i % Math.ceil(series.length / 8 || 1) === 0 || i === series.length - 1 ? <span key={d.dayKey}>{dayLabel(d.dayKey)}</span> : <span key={d.dayKey} />))}
      </div>
    </article>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()

  const [activeAccount, setActiveAccount] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [trades, setTrades] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionMessage, setActionMessage] = useState(null)
  const [actionError, setActionError] = useState(null)

  const [selectedDay, setSelectedDay] = useState(null)
  const [search, setSearch] = useState('')
  const [setupFilter, setSetupFilter] = useState('all')

  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const [profileOpen, setProfileOpen] = useState(false)
  const [whatIfBoost, setWhatIfBoost] = useState(0)

  const [showAddTradeModal, setShowAddTradeModal] = useState(false)
  const [showCsvModal, setShowCsvModal] = useState(false)
  const [submittingTrade, setSubmittingTrade] = useState(false)
  const [importingCsv, setImportingCsv] = useState(false)
  const [csvFile, setCsvFile] = useState(null)

  const [daysTimer, setDaysTimer] = useState({ days: 0, hours: 0 })

  const [tradeForm, setTradeForm] = useState({
    symbol: '',
    type: 'buy',
    lot_size: '0.10',
    pnl: '',
    close_time: new Date().toISOString().slice(0, 16),
    strategy_tag: '',
    entry_price: '',
    exit_price: '',
  })

  const [setupForm, setSetupForm] = useState({
    account_name: '',
    initial_balance: '',
    profit_target: '',
    consistency_rule_percent: '',
    daily_drawdown_limit_percent: '',
    max_loss_limit_percent: '',
    timezone: 'UTC',
  })

  async function loadDashboardData() {
    try {
      setLoading(true)
      setError(null)

      const accounts = await axios.get('/accounts')
      const account = accounts.data.data?.[0] || null
      setActiveAccount(account)

      if (!account) {
        setMetrics(null)
        setTrades([])
        return
      }

      const [m, t] = await Promise.all([
        axios.get(`/accounts/${account.id}/metrics`),
        axios.get(`/accounts/${account.id}/trades`),
      ])

      setMetrics(m.data.data)
      const items = t.data.data.data || t.data.data || []
      setTrades(Array.isArray(items) ? items : [])
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login')
        return
      }
      setError(err.response?.data?.message || 'Failed to load command center data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const normalizedTrades = useMemo(() => {
    return trades.map((t) => ({
      ...t,
      pnl: Number(t.pnl || 0),
      setup: t.strategy_tag || 'General',
      close_time: t.close_time || new Date().toISOString(),
      dayKey: dayKey(t.close_time),
      mood: getMood(Number(t.pnl || 0)),
    }))
  }, [trades])

  const dailySeries = useMemo(() => {
    const map = new Map()
    normalizedTrades.forEach((t) => {
      if (!map.has(t.dayKey)) {
        map.set(t.dayKey, { dayKey: t.dayKey, dailyPnl: 0, totalTrades: 0 })
      }
      const row = map.get(t.dayKey)
      row.dailyPnl += t.pnl
      row.totalTrades += 1
    })

    const sorted = Array.from(map.values()).sort((a, b) => a.dayKey.localeCompare(b.dayKey))
    let balance = Number(activeAccount?.initial_balance || START_BALANCE)

    return sorted.map((d) => {
      balance += d.dailyPnl
      return { ...d, balance }
    })
  }, [normalizedTrades, activeAccount?.initial_balance])

  useEffect(() => {
    const usedTradingDays = Math.max(1, dailySeries.length)
    const daysRemaining = Math.max(0, 30 - usedTradingDays)

    const tick = () => {
      const now = new Date()
      const nextHour = new Date(now)
      nextHour.setHours(now.getHours() + 1, 0, 0, 0)
      const diff = Math.max(0, nextHour.getTime() - now.getTime())
      setDaysTimer({ days: daysRemaining, hours: Math.floor(diff / (1000 * 60 * 60)) })
    }

    tick()
    const timer = setInterval(tick, 60000)
    return () => clearInterval(timer)
  }, [dailySeries.length])

  const equity = Number(metrics?.currentBalance || dailySeries.at(-1)?.balance || activeAccount?.initial_balance || START_BALANCE)
  const initialBalance = Number(activeAccount?.initial_balance || START_BALANCE)
  const totalProfit = Math.max(0, equity - initialBalance)

  const profitTarget = Number(metrics?.profitTarget || activeAccount?.profit_target || 10000)
  const consistencyLimit = Number(activeAccount?.consistency_rule_percent || CONSISTENCY_RULE)
  const dailyDrawdownLimit = Number(activeAccount?.daily_drawdown_limit_percent || MAX_DRAWDOWN_RULE)
  const maxLossLimit = Number(activeAccount?.max_loss_limit_percent || 10)

  const dailyDrawdownPercent = Number(metrics?.dailyDrawdownPercent || 0)
  const maxLossPercent = Number(metrics?.maxLossPercent || 0)
  const topDayPctRaw = Number(metrics?.topDailyPercentOfTarget || 0)
  const topDayProfitEstimate = (topDayPctRaw / 100) * totalProfit
  const whatIfConsistency = (topDayProfitEstimate / Math.max(totalProfit + whatIfBoost, 1)) * 100
  const consistencyPct = whatIfBoost > 0 ? whatIfConsistency : topDayPctRaw

  const progressToTargetPct = Math.min(100, Math.max(0, (totalProfit / Math.max(profitTarget, 1)) * 100))
  const drawdownUsagePct = Math.min(100, Math.max(0, (dailyDrawdownPercent / Math.max(dailyDrawdownLimit, 0.01)) * 100))
  const consistencyUsagePct = Math.min(100, Math.max(0, (consistencyPct / Math.max(consistencyLimit, 0.01)) * 100))
  const liquidationDistancePct = Math.max(0, Math.min(100, 100 - ((maxLossPercent / Math.max(maxLossLimit, 0.01)) * 100)))

  const consistencyState = getStatusFromPct(consistencyUsagePct)
  const drawdownState = getStatusFromPct(drawdownUsagePct)

  const dailyLossBufferAmount = initialBalance * (dailyDrawdownLimit / 100)
  const dailyLossUsedAmount = initialBalance * (dailyDrawdownPercent / 100)
  const dailyLossRemaining = Math.max(0, dailyLossBufferAmount - dailyLossUsedAmount)

  const sparklinePoints = useMemo(() => {
    const values = dailySeries.slice(-7).map((d) => d.balance)
    return values.length >= 2 ? values : [initialBalance - 200, initialBalance - 80, initialBalance + 40, initialBalance + 120, initialBalance + 180, initialBalance + 230, equity]
  }, [dailySeries, initialBalance, equity])

  const setupOptions = useMemo(() => ['all', ...Array.from(new Set(normalizedTrades.map((t) => t.setup)))], [normalizedTrades])

  const filteredTrades = useMemo(() => {
    return normalizedTrades.filter((t) => {
      if (selectedDay && t.dayKey !== selectedDay) return false
      if (setupFilter !== 'all' && t.setup !== setupFilter) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return String(t.symbol || '').toLowerCase().includes(q) || String(t.setup || '').toLowerCase().includes(q)
    })
  }, [normalizedTrades, selectedDay, setupFilter, search])

  const strategyMatrix = useMemo(() => {
    const presets = ['Silver Bullet', 'Judas Swing', 'London Open']
    return presets.map((preset) => {
      const rows = normalizedTrades.filter((t) => t.setup.toLowerCase() === preset.toLowerCase())
      if (!rows.length) return { setup: preset, winRate: 0, pf: 0, expectancy: 0 }

      const wins = rows.filter((t) => t.pnl > 0)
      const losses = rows.filter((t) => t.pnl < 0)
      const grossWin = wins.reduce((sum, t) => sum + t.pnl, 0)
      const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0))
      const net = rows.reduce((sum, t) => sum + t.pnl, 0)

      return {
        setup: preset,
        winRate: (wins.length / rows.length) * 100,
        pf: grossLoss > 0 ? grossWin / grossLoss : (grossWin > 0 ? 99 : 0),
        expectancy: net / rows.length,
      }
    })
  }, [normalizedTrades])

  const heatmapCells = useMemo(() => {
    const byDay = new Map()
    normalizedTrades.forEach((t) => {
      byDay.set(t.dayKey, (byDay.get(t.dayKey) || 0) + t.pnl)
    })

    const cells = []
    const today = new Date()
    for (let i = 83; i >= 0; i -= 1) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const pnl = byDay.get(key) || 0
      cells.push({ key, pnl, mood: getMood(pnl) })
    }
    return cells
  }, [normalizedTrades])

  function setupField(key) {
    return (e) => setSetupForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  function tradeField(key) {
    return (e) => setTradeForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  async function handleCreateAccount(e) {
    e.preventDefault()
    setActionError(null)
    setActionMessage(null)

    try {
      await axios.post('/accounts', {
        account_name: setupForm.account_name,
        initial_balance: Number(setupForm.initial_balance),
        current_balance: Number(setupForm.initial_balance),
        profit_target: Number(setupForm.profit_target),
        consistency_rule_percent: Number(setupForm.consistency_rule_percent),
        daily_drawdown_limit_percent: Number(setupForm.daily_drawdown_limit_percent),
        max_loss_limit_percent: Number(setupForm.max_loss_limit_percent),
        timezone: setupForm.timezone || 'UTC',
        status: 'active',
      })

      setActionMessage('Account created successfully. Command center is now live.')
      await loadDashboardData()
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to create account.')
    }
  }

  async function handleAddTradeSubmit(e) {
    e.preventDefault()
    if (!activeAccount) {
      setActionError('Create an account before adding trades.')
      return
    }

    setSubmittingTrade(true)
    setActionError(null)
    setActionMessage(null)

    try {
      await axios.post(`/accounts/${activeAccount.id}/trades`, {
        symbol: tradeForm.symbol.trim().toUpperCase(),
        type: tradeForm.type,
        lot_size: Number(tradeForm.lot_size || 0),
        pnl: Number(tradeForm.pnl),
        close_time: new Date(tradeForm.close_time).toISOString(),
        strategy_tag: tradeForm.strategy_tag || null,
        entry_price: tradeForm.entry_price ? Number(tradeForm.entry_price) : null,
        exit_price: tradeForm.exit_price ? Number(tradeForm.exit_price) : null,
      })

      setActionMessage('Trade added and metrics refreshed.')
      setShowAddTradeModal(false)
      setTradeForm((prev) => ({ ...prev, symbol: '', pnl: '', strategy_tag: '', entry_price: '', exit_price: '' }))
      await loadDashboardData()
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to add trade.')
    } finally {
      setSubmittingTrade(false)
    }
  }

  async function handleCsvImportSubmit(e) {
    e.preventDefault()
    if (!activeAccount) {
      setActionError('Create an account before importing CSV.')
      return
    }
    if (!csvFile) {
      setActionError('Select a CSV file to import.')
      return
    }

    setImportingCsv(true)
    setActionError(null)
    setActionMessage(null)

    try {
      const form = new FormData()
      form.append('account_id', String(activeAccount.id))
      form.append('csv_file', csvFile)

      const res = await axios.post(`/accounts/${activeAccount.id}/import-csv`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const data = res.data?.data || {}
      setActionMessage(`CSV imported. Added ${data.imported ?? 0}, skipped ${data.duplicates ?? 0} duplicates.`)
      setShowCsvModal(false)
      setCsvFile(null)
      await loadDashboardData()
    } catch (err) {
      setActionError(err.response?.data?.message || 'CSV import failed.')
    } finally {
      setImportingCsv(false)
    }
  }

  function jumpTo(id) {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const serverStatus = activeAccount ? 'LIVE' : 'SETUP'

  return (
    <div className="elite-shell">
      <aside className={`elite-sidebar ${isSidebarOpen ? '' : 'collapsed'}`}>
        <div className="elite-brand">Smaedala FX</div>
        <button className="elite-nav-btn" title="Overview" onClick={() => jumpTo('overview-section')}><IconGrid /><span>Overview</span></button>
        <button className="elite-nav-btn" title="Strategy Matrix" onClick={() => jumpTo('strategy-section')}><IconMatrix /><span>Strategy Matrix</span></button>
        <button className="elite-nav-btn" title="Psychology" onClick={() => jumpTo('psychology-section')}><IconPsychology /><span>Psychology</span></button>
        <button className="elite-nav-btn" title="Rule Presets" onClick={() => navigate('/risk-settings')}><IconRules /><span>Rule Presets</span></button>
        <button className="elite-nav-btn" title="Settings" onClick={() => navigate('/risk-settings')}><IconSettings /><span>Settings</span></button>
      </aside>

      <main className="elite-main">
        <header className="elite-header">
          <button type="button" className="elite-icon-btn" onClick={() => setSidebarOpen((v) => !v)}>☰</button>

          <div className="elite-search-wrap">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Command palette: search symbol, strategy, or trade..."
            />
          </div>

          <div className="elite-ticker" role="status" aria-live="polite">
            [DAILY ROOM: +${Math.round(dailyLossRemaining).toLocaleString()}] | [CONSISTENCY: {consistencyState.label} ({consistencyPct.toFixed(1)}%)] | [SERVER: {serverStatus}]
          </div>

          <div className="elite-profile-wrap">
            <button type="button" className="elite-profile" onClick={() => setProfileOpen((v) => !v)}>
              <span className="elite-avatar">S</span>
              <span>
                <strong>Smaedala</strong>
                <small>PRO TRADER</small>
              </span>
            </button>
            {profileOpen ? (
              <div className="elite-profile-menu">
                <p>{activeAccount?.account_name || 'No account'}</p>
                <small>Account ID: {activeAccount?.id || 'N/A'}</small>
                <button type="button" onClick={() => navigate('/risk-settings')}>Settings</button>
                <button type="button" onClick={() => setActionMessage('Billing screen coming next.')}>Billing</button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => {
                    localStorage.removeItem('api_token')
                    delete axios.defaults.headers.common.Authorization
                    navigate('/login')
                  }}
                >
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <section className="elite-actions-row">
          <button type="button" onClick={() => setShowAddTradeModal(true)}>Add Trade</button>
          <button type="button" onClick={() => setShowCsvModal(true)}>Import MT4/5 CSV</button>
          <button type="button" onClick={() => navigate('/trade-log')}>Open Trade Log</button>
          <button type="button" onClick={() => navigate('/alerts')}>Open Alerts</button>
        </section>

        {activeAccount ? (
          <section className="elite-liquidation-bar">
            <div>
              <strong>Distance to Liquidation</strong>
              <span>{liquidationDistancePct.toFixed(0)}%</span>
            </div>
            <div className="elite-liquid-track">
              <span style={{ width: `${liquidationDistancePct}%` }} />
            </div>
          </section>
        ) : null}

        {actionMessage ? <div className="elite-flash success">{actionMessage}</div> : null}
        {actionError ? <div className="elite-flash error">{actionError}</div> : null}
        {error ? <div className="elite-flash error">{error}</div> : null}

        {loading ? <div className="elite-state">Loading command center...</div> : !activeAccount ? (
          <section className="elite-card elite-setup-card">
            <h2>Connect Your First Trading Account</h2>
            <p>All analytics stay unset until you define your prop-firm profile and rule engine.</p>
            <form className="elite-setup-form" onSubmit={handleCreateAccount}>
              <label>Account Name<input value={setupForm.account_name} onChange={setupField('account_name')} placeholder="FTMO 100K" required /></label>
              <label>Starting Balance<input type="number" min="0" step="0.01" value={setupForm.initial_balance} onChange={setupField('initial_balance')} required /></label>
              <label>Profit Target<input type="number" min="0" step="0.01" value={setupForm.profit_target} onChange={setupField('profit_target')} required /></label>
              <label>Consistency Rule %<input type="number" min="1" max="100" value={setupForm.consistency_rule_percent} onChange={setupField('consistency_rule_percent')} required /></label>
              <label>Daily Drawdown %<input type="number" min="1" max="100" value={setupForm.daily_drawdown_limit_percent} onChange={setupField('daily_drawdown_limit_percent')} required /></label>
              <label>Max Loss %<input type="number" min="1" max="100" value={setupForm.max_loss_limit_percent} onChange={setupField('max_loss_limit_percent')} required /></label>
              <button type="submit">Activate Command Center</button>
            </form>
          </section>
        ) : (
          <>
            <section className="elite-metric-grid">
              <article className="elite-card elite-metric">
                <p>EQUITY</p>
                <h3>€{formatMoney(equity)}</h3>
                <small>Live account balance</small>
                <Sparkline points={sparklinePoints} />
              </article>

              <article className="elite-card elite-metric">
                <p>TARGET PROGRESS</p>
                <h3>{progressToTargetPct.toFixed(0)}%</h3>
                <small>€{formatMoney(totalProfit)} / €{formatMoney(profitTarget)}</small>
                <div className="elite-progress"><span style={{ width: `${progressToTargetPct}%` }} /></div>
              </article>

              <article className="elite-card elite-metric">
                <p>DAILY LOSS BUFFER</p>
                <h3>€{formatMoney(dailyLossRemaining)}</h3>
                <small>{dailyDrawdownPercent.toFixed(2)}% used of {dailyDrawdownLimit.toFixed(2)}%</small>
                <div className="elite-progress red"><span style={{ width: `${drawdownUsagePct}%` }} /></div>
              </article>

              <article className={`elite-card elite-metric ${consistencyState.cls}`}>
                <p>CONSISTENCY BADGE</p>
                <h3>{consistencyState.label}</h3>
                <small>{consistencyPct.toFixed(1)}% of {consistencyLimit}% rule</small>
              </article>
            </section>

            <section className="elite-core-grid">
              <EquityChart series={dailySeries} selectedDay={selectedDay} onSelectDay={setSelectedDay} />

              <aside className="elite-card elite-gauge-card">
                <h3>Consistency Monitor</h3>
                <p>40% rule proximity visualizer</p>
                <label className="elite-whatif">
                  <span>What-If: +€{whatIfBoost.toLocaleString()}</span>
                  <input
                    type="range"
                    min="0"
                    max="5000"
                    step="250"
                    value={whatIfBoost}
                    onChange={(e) => setWhatIfBoost(Number(e.target.value))}
                  />
                </label>

                <div className="elite-ring" style={{ '--ring-progress': `${consistencyUsagePct}` }}>
                  <div>
                    <strong>{consistencyPct.toFixed(1)}%</strong>
                    <span>of {consistencyLimit}%</span>
                  </div>
                </div>

                <div className="elite-threshold">
                  <span>Danger Threshold</span>
                  <strong>{consistencyLimit}%</strong>
                </div>
              </aside>
            </section>

            <section className="elite-analytics-grid">
              <article className="elite-card" id="strategy-section">
                <h3>Strategy Matrix</h3>
                <div className="elite-matrix-head">
                  <span>Setup</span>
                  <span>Win Rate</span>
                  <span>Profit Factor</span>
                  <span>Expectancy</span>
                </div>
                {strategyMatrix.map((row) => (
                  <div key={row.setup} className="elite-matrix-row">
                    <span>{row.setup}</span>
                    <span>{row.winRate.toFixed(1)}%</span>
                    <span>{row.pf === 99 ? '∞' : row.pf.toFixed(2)}</span>
                    <span>{row.expectancy.toFixed(2)}</span>
                  </div>
                ))}
              </article>

              <article className="elite-card" id="psychology-section">
                <h3>Psychology Heatmap</h3>
                <div className="elite-heatmap">
                  {heatmapCells.map((cell) => (
                    <span
                      key={cell.key}
                      className={`elite-heat ${cell.mood.cls}`}
                      title={`${cell.key} • ${cell.mood.label} • ${cell.pnl >= 0 ? '+' : ''}${cell.pnl.toFixed(2)}`}
                    />
                  ))}
                </div>
              </article>
            </section>

            <section className="elite-card elite-trade-gallery">
              <div className="elite-gallery-head">
                <h3>Trade Gallery</h3>
                <div className="elite-gallery-filters">
                  <select value={setupFilter} onChange={(e) => setSetupFilter(e.target.value)}>
                    {setupOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt === 'all' ? 'All Setups' : opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="elite-trades-head">
                <span>Symbol</span>
                <span>Type</span>
                <span>Lot Size</span>
                <span>PnL</span>
              </div>

              {filteredTrades.length === 0 ? (
                <div className="elite-state">No trades match current filters.</div>
              ) : filteredTrades.map((t) => (
                <div key={t.id} className="elite-trades-row">
                  <span>{t.symbol || '-'}</span>
                  <span>{String(t.type || '').toUpperCase()}</span>
                  <span>{Number(t.lot_size || 0).toFixed(2)}</span>
                  <span className={t.pnl >= 0 ? 'pos' : 'neg'}>{t.pnl >= 0 ? '+' : ''}{formatMoney(t.pnl)}</span>
                </div>
              ))}
            </section>
          </>
        )}

        {showAddTradeModal ? (
          <div className="elite-modal-backdrop" onClick={() => setShowAddTradeModal(false)}>
            <div className="elite-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Add Trade</h3>
              <form className="elite-modal-form" onSubmit={handleAddTradeSubmit}>
                <label>Symbol<input value={tradeForm.symbol} onChange={tradeField('symbol')} placeholder="XAUUSD" required /></label>
                <label>Type
                  <select value={tradeForm.type} onChange={tradeField('type')}>
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                  </select>
                </label>
                <label>Lot Size<input type="number" min="0" step="0.01" value={tradeForm.lot_size} onChange={tradeField('lot_size')} /></label>
                <label>PnL<input type="number" step="0.01" value={tradeForm.pnl} onChange={tradeField('pnl')} required /></label>
                <label>Close Time<input type="datetime-local" value={tradeForm.close_time} onChange={tradeField('close_time')} required /></label>
                <label>Strategy Tag<input value={tradeForm.strategy_tag} onChange={tradeField('strategy_tag')} placeholder="Silver Bullet" /></label>
                <div className="elite-modal-actions">
                  <button type="button" onClick={() => setShowAddTradeModal(false)}>Cancel</button>
                  <button type="submit" disabled={submittingTrade}>{submittingTrade ? 'Saving...' : 'Save Trade'}</button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {showCsvModal ? (
          <div className="elite-modal-backdrop" onClick={() => setShowCsvModal(false)}>
            <div className="elite-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Import MT4/MT5 CSV</h3>
              <form className="elite-modal-form" onSubmit={handleCsvImportSubmit}>
                <label>CSV File<input type="file" accept=".csv,.txt" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} required /></label>
                <small>Expected headers include symbol, type, pnl, close_time.</small>
                <div className="elite-modal-actions">
                  <button type="button" onClick={() => setShowCsvModal(false)}>Cancel</button>
                  <button type="submit" disabled={importingCsv}>{importingCsv ? 'Importing...' : 'Import CSV'}</button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}

