import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'

const START_BALANCE = 100000
const MAX_DRAWDOWN_RULE = 5
const CONSISTENCY_RULE = 40

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

function moodFromPnl(pnl) {
  if (pnl >= 250) return { label: 'Calm', tone: 'green' }
  if (pnl >= 0) return { label: 'Focused', tone: 'cyan' }
  if (pnl <= -250) return { label: 'FOMO', tone: 'red' }
  return { label: 'Frustrated', tone: 'yellow' }
}

function statusFromPct(pct) {
  if (pct >= 100) return 'red'
  if (pct >= 70) return 'yellow'
  return 'green'
}

function NavGridIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" />
    </svg>
  )
}

function NavTradeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3h9l5 5v13H6V3Zm2 2v14h10V9h-4V5H8Zm2 6h6v2h-6v-2Z" />
    </svg>
  )
}

function NavRiskIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2 3 6v6c0 5.2 3.4 9.8 9 12 5.6-2.2 9-6.8 9-12V6l-9-4Zm0 2.2 7 3.1v4.6c0 4.1-2.6 8-7 9.9-4.4-1.9-7-5.8-7-9.9V7.3l7-3.1Z" />
    </svg>
  )
}

function NavChartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 19h16v2H2V3h2v16Zm3-3 3.8-4.2 3.1 2.8L19 8.5V12h2V5h-7v2h3.6l-3.9 4.3-3.1-2.8L5.5 14 7 16Z" />
    </svg>
  )
}

function NavBellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2a6 6 0 0 0-6 6v3.3L4.3 14a1 1 0 0 0 .8 1.6h13.8a1 1 0 0 0 .8-1.6L18 11.3V8a6 6 0 0 0-6-6Zm0 20a2.8 2.8 0 0 0 2.6-1.8h-5.2A2.8 2.8 0 0 0 12 22Z" />
    </svg>
  )
}

function MiniSparkline({ points }) {
  const path = useMemo(() => {
    if (points.length < 2) return ''
    const max = Math.max(...points)
    const min = Math.min(...points)
    const range = Math.max(max - min, 1)
    return points
      .map((v, i) => {
        const x = (i / (points.length - 1)) * 100
        const y = 85 - ((v - min) / range) * 70
        return `${x},${y}`
      })
      .join(' ')
  }, [points])

  return (
    <svg className="dash4-sparkline" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={path} fill="none" stroke="#00F2FE" strokeWidth="4" />
    </svg>
  )
}

function MetricCard({ title, value, caption, progress, progressColor, statusTone, sparkline, animated }) {
  return (
    <article className={`dash4-card ${statusTone ? `dash4-card-${statusTone}` : ''}`}>
      <p>{title}</p>
      <div className="dash4-value-row">
        <h3>{value}</h3>
        {sparkline ? <MiniSparkline points={sparkline} /> : null}
      </div>
      <small>{caption}</small>
      {typeof progress === 'number' && (
        <div className="dash4-progress">
          <span style={{ width: `${animated ? progress : 0}%`, background: progressColor }} />
        </div>
      )}
    </article>
  )
}

function InteractiveChart({ data, selectedDay, onSelectDay }) {
  const chartRef = useRef(null)
  const [hovered, setHovered] = useState(null)

  const points = useMemo(() => {
    if (!data.length) return []
    const max = Math.max(...data.map((d) => d.balance))
    const min = Math.min(...data.map((d) => d.balance))
    const range = Math.max(max - min, 1)
    return data.map((d, i) => ({
      ...d,
      x: (i / Math.max(data.length - 1, 1)) * 100,
      y: 76 - ((d.balance - min) / range) * 34,
    }))
  }, [data])

  const linePath = points.map((p) => `${p.x},${p.y}`).join(' ')

  function handleMove(evt) {
    if (!chartRef.current || !points.length) return
    const rect = chartRef.current.getBoundingClientRect()
    const relX = ((evt.clientX - rect.left) / rect.width) * 100
    let nearest = points[0]
    let nearestDistance = Math.abs(points[0].x - relX)
    for (let i = 1; i < points.length; i += 1) {
      const distance = Math.abs(points[i].x - relX)
      if (distance < nearestDistance) {
        nearest = points[i]
        nearestDistance = distance
      }
    }
    setHovered(nearest)
  }

  return (
    <div className="dash4-chart">
      <h3>Equity Curve</h3>
      <div className="dash4-chart-inner" ref={chartRef} onMouseMove={handleMove} onMouseLeave={() => setHovered(null)}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Interactive equity curve">
          <defs>
            <linearGradient id="dash4Fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(0,242,254,0.34)" />
              <stop offset="100%" stopColor="rgba(0,242,254,0.02)" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="100" height="100" fill="#161b24" />
          <polyline points="0,20 100,20" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 2" fill="none" />
          <polyline points="0,50 100,50" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 2" fill="none" />
          <polyline points="0,80 100,80" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 2" fill="none" />
          {linePath && (
            <>
              <polygon points={`0,100 ${linePath} 100,100`} fill="url(#dash4Fill)" />
              <polyline points={linePath} fill="none" stroke="#00F2FE" strokeWidth="0.9" />
            </>
          )}
          {points.map((p) => (
            <circle
              key={p.dayKey}
              cx={p.x}
              cy={p.y}
              r={selectedDay === p.dayKey ? 1.4 : 1}
              className={`dash4-dot ${selectedDay === p.dayKey ? 'active' : ''}`}
              onClick={() => onSelectDay(selectedDay === p.dayKey ? null : p.dayKey)}
            />
          ))}
        </svg>
        {hovered && (
          <div className="dash4-tooltip" style={{ left: `${hovered.x}%`, top: `${hovered.y}%` }}>
            <strong>{dayLabel(hovered.dayKey)}</strong>
            <span>Balance: €{hovered.balance.toLocaleString()}</span>
            <span>Daily PnL: {hovered.dailyPnl >= 0 ? '+' : ''}{hovered.dailyPnl.toLocaleString()}</span>
            <span>Total Trades: {hovered.totalTrades}</span>
          </div>
        )}
      </div>
      <div className="dash4-axis">
        {data.map((d, i) => (i % Math.ceil(data.length / 8) === 0 || i === data.length - 1 ? <span key={d.dayKey}>{dayLabel(d.dayKey)}</span> : <span key={d.dayKey} />))}
      </div>
      {selectedDay && (
        <div className="dash4-filter-pill">
          Filtered by: {dayLabel(selectedDay)} <button type="button" onClick={() => onSelectDay(null)}>Clear</button>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeAccount, setActiveAccount] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const [search, setSearch] = useState('')
  const [setupFilter, setSetupFilter] = useState('all')
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const [whatIfBoost, setWhatIfBoost] = useState(0)
  const [animatedBars, setAnimatedBars] = useState(false)
  const [daysTimer, setDaysTimer] = useState({ days: 0, hours: 0 })
  const [creatingAccount, setCreatingAccount] = useState(false)
  const [setupMessage, setSetupMessage] = useState(null)
  const [actionMessage, setActionMessage] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [showAddTradeModal, setShowAddTradeModal] = useState(false)
  const [showCsvModal, setShowCsvModal] = useState(false)
  const [submittingTrade, setSubmittingTrade] = useState(false)
  const [importingCsv, setImportingCsv] = useState(false)
  const [csvFile, setCsvFile] = useState(null)
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
    trade_source: '',
  })

  async function loadDashboardData() {
    try {
      setLoading(true)
      setError(null)
      const accounts = await axios.get('/accounts')
      const account = accounts.data.data[0] || null
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
      const items = t.data.data.data || t.data.data
      setTrades(Array.isArray(items) ? items : [])
    } catch (err) {
      if (err.response && err.response.status === 401) {
        navigate('/login')
        return
      }
      setError(err.response?.data?.message || 'Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [navigate])

  useEffect(() => {
    const id = setTimeout(() => setAnimatedBars(true), 130)
    return () => clearTimeout(id)
  }, [])

  const normalizedTrades = useMemo(() => {
    return trades.map((t) => ({
      ...t,
      pnl: Number(t.pnl || 0),
      setup: t.strategy_tag || 'General',
      close_time: t.close_time || new Date().toISOString(),
      dayKey: dayKey(t.close_time),
      emotion: moodFromPnl(Number(t.pnl || 0)),
    }))
  }, [trades])

  const dailySeries = useMemo(() => {
    const map = new Map()
    normalizedTrades.forEach((t) => {
      if (!map.has(t.dayKey)) {
        map.set(t.dayKey, { dayKey: t.dayKey, dailyPnl: 0, totalTrades: 0 })
      }
      const day = map.get(t.dayKey)
      day.dailyPnl += Number(t.pnl || 0)
      day.totalTrades += 1
    })

    const sorted = Array.from(map.values()).sort((a, b) => a.dayKey.localeCompare(b.dayKey))
    let balance = Number(activeAccount?.initial_balance || START_BALANCE)
    return sorted.map((d) => {
      balance += d.dailyPnl
      return { ...d, balance: Math.round(balance) }
    })
  }, [normalizedTrades, activeAccount?.initial_balance])

  const equity = Number(metrics?.currentBalance || (dailySeries.at(-1)?.balance || activeAccount?.initial_balance || START_BALANCE))
  const profitTarget = Number(metrics?.profitTarget || activeAccount?.profit_target || 10000)
  const consistencyRulePercent = Number(activeAccount?.consistency_rule_percent || CONSISTENCY_RULE)
  const dailyDrawdownLimitPercent = Number(activeAccount?.daily_drawdown_limit_percent || MAX_DRAWDOWN_RULE)
  const maxLossLimitPercent = Number(activeAccount?.max_loss_limit_percent || 10)
  const dailyDrawdownPercent = Number(metrics?.dailyDrawdownPercent || 0)
  const maxLossPercent = Number(metrics?.maxLossPercent || 0)
  const totalProfit = Math.max(0, equity - Number(activeAccount?.initial_balance || START_BALANCE))
  const topDayPctRaw = Number(metrics?.topDailyPercentOfTarget || 0)
  const topDayProfitEstimate = (topDayPctRaw / 100) * totalProfit
  const simulatedPct = (topDayProfitEstimate / Math.max(totalProfit + whatIfBoost, 1)) * 100
  const consistencyPct = whatIfBoost > 0 ? simulatedPct : topDayPctRaw

  const dailyDrawdownUsedPct = Math.min(100, Math.max(0, (dailyDrawdownPercent / Math.max(dailyDrawdownLimitPercent, 0.01)) * 100))
  const consistencyUsedPct = Math.min(100, Math.max(0, (consistencyPct / Math.max(consistencyRulePercent, 0.01)) * 100))
  const maxLossUsedPct = Math.min(100, Math.max(0, (maxLossPercent / Math.max(maxLossLimitPercent, 0.01)) * 100))
  const drawdownTone = statusFromPct(dailyDrawdownUsedPct)
  const consistencyTone = statusFromPct(consistencyUsedPct)

  const drawdownLimitAmount = Number(activeAccount?.initial_balance || START_BALANCE) * (dailyDrawdownLimitPercent / 100)
  const drawdownUsedAmount = Number(activeAccount?.initial_balance || START_BALANCE) * (dailyDrawdownPercent / 100)
  const dailyLossRemaining = Math.max(0, Math.round(drawdownLimitAmount - drawdownUsedAmount))
  const distanceToLiquidation = Math.max(0, Math.round(100 - maxLossUsedPct))
  const profitProgress = Math.min(100, Math.max(0, (totalProfit / Math.max(profitTarget, 1)) * 100))

  const riskAlerts = useMemo(() => {
    if (!activeAccount) return []
    const alerts = []
    if (dailyDrawdownUsedPct >= 100) {
      alerts.push({ tone: 'red', text: 'Daily drawdown limit breached. Stop trading on this account today.' })
    } else if (dailyDrawdownUsedPct >= 70) {
      alerts.push({ tone: 'yellow', text: `Daily drawdown at ${dailyDrawdownPercent.toFixed(2)}% / ${dailyDrawdownLimitPercent}% limit.` })
    } else {
      alerts.push({ tone: 'green', text: 'Daily drawdown is within safe range.' })
    }

    if (consistencyUsedPct >= 100) {
      alerts.push({ tone: 'red', text: `Consistency breach risk reached ${consistencyPct.toFixed(1)}% / ${consistencyRulePercent}%.` })
    } else if (consistencyUsedPct >= 70) {
      alerts.push({ tone: 'yellow', text: `Consistency warning: ${consistencyPct.toFixed(1)}% / ${consistencyRulePercent}%.` })
    } else {
      alerts.push({ tone: 'green', text: 'Consistency profile is safe for now.' })
    }

    if (maxLossUsedPct >= 100 || activeAccount?.status === 'breached') {
      alerts.push({ tone: 'red', text: 'Account is marked breached by max loss rule.' })
    }

    return alerts
  }, [activeAccount, consistencyPct, consistencyRulePercent, consistencyUsedPct, dailyDrawdownLimitPercent, dailyDrawdownPercent, dailyDrawdownUsedPct, maxLossUsedPct])

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

  const sparklinePoints = useMemo(() => {
    const slice = dailySeries.slice(-7).map((d) => d.balance)
    return slice.length >= 2 ? slice : null
  }, [dailySeries])

  const strategyBreakdown = useMemo(() => {
    const map = new Map()
    normalizedTrades.forEach((t) => {
      if (!map.has(t.setup)) {
        map.set(t.setup, { setup: t.setup, trades: 0, wins: 0, pnl: 0, grossWin: 0, grossLoss: 0 })
      }
      const s = map.get(t.setup)
      s.trades += 1
      s.pnl += t.pnl
      if (t.pnl >= 0) {
        s.wins += 1
        s.grossWin += t.pnl
      } else {
        s.grossLoss += Math.abs(t.pnl)
      }
    })
    return Array.from(map.values()).map((s) => ({
      ...s,
      winRate: s.trades ? Math.round((s.wins / s.trades) * 100) : 0,
      profitFactor: s.grossLoss > 0 ? s.grossWin / s.grossLoss : s.grossWin > 0 ? 99 : 0,
    }))
  }, [normalizedTrades])

  const ictStrategyMatrix = useMemo(() => {
    const target = ['Silver Bullet', 'London Open', 'Judas Swing']
    return target.map((name) => {
      const match = strategyBreakdown.find((s) => s.setup.toLowerCase() === name.toLowerCase())
      if (match) return match
      return { setup: name, profitFactor: 0, trades: 0, winRate: 0, pnl: 0, expectancy: 0 }
    })
  }, [strategyBreakdown])

  const heatmapDays = useMemo(() => dailySeries.slice(-21).map((d) => ({ ...d, mood: moodFromPnl(d.dailyPnl) })), [dailySeries])

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
    const timer = setInterval(tick, 60 * 1000)
    return () => clearInterval(timer)
  }, [dailySeries.length])

  async function handleCreateAccount(e) {
    e.preventDefault()
    setCreatingAccount(true)
    setSetupMessage(null)
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
      setSetupMessage('Account created successfully. Your live dashboard is ready.')
      await loadDashboardData()
    } catch (err) {
      setSetupMessage(err.response?.data?.message || 'Failed to create account. Please check your fields.')
    } finally {
      setCreatingAccount(false)
    }
  }

  const setupSteps = [
    { label: 'Firm & Challenge Type', done: Boolean(activeAccount?.account_name || setupForm.account_name) },
    { label: 'Rule Limits', done: Boolean((activeAccount?.consistency_rule_percent || setupForm.consistency_rule_percent) && (activeAccount?.daily_drawdown_limit_percent || setupForm.daily_drawdown_limit_percent)) },
    { label: 'Starting Balance', done: Number(activeAccount?.initial_balance || setupForm.initial_balance || 0) > 0 },
    { label: 'Trade Source', done: Boolean(setupForm.trade_source) },
  ]

  const setupDoneCount = setupSteps.filter((s) => s.done).length
  const setupProgress = Math.round((setupDoneCount / setupSteps.length) * 100)

  function setupField(key) {
    return (e) => setSetupForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  function tradeField(key) {
    return (e) => setTradeForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  async function handleAddTradeSubmit(e) {
    e.preventDefault()
    if (!activeAccount) {
      setActionError('Create an account first before adding trades.')
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

      setActionMessage('Trade added successfully and metrics refreshed.')
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
      setActionError('Create an account first before importing CSV.')
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
      const formData = new FormData()
      formData.append('account_id', String(activeAccount.id))
      formData.append('csv_file', csvFile)
      const res = await axios.post(`/accounts/${activeAccount.id}/import-csv`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const result = res.data?.data || {}
      setActionMessage(`CSV imported. Added ${result.imported ?? 0} trades, skipped ${result.duplicates ?? 0} duplicates.`)
      setShowCsvModal(false)
      setCsvFile(null)
      await loadDashboardData()
    } catch (err) {
      setActionError(err.response?.data?.message || 'CSV import failed.')
    } finally {
      setImportingCsv(false)
    }
  }

  const navGroups = [
    {
      title: 'Workspace',
      items: [
        { key: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: <NavGridIcon /> },
        { key: 'trade-log', path: '/trade-log', label: 'Trade Log', icon: <NavTradeIcon /> },
        { key: 'risk', path: '/risk-settings', label: 'Risk Settings', icon: <NavRiskIcon /> },
      ],
    },
    {
      title: 'Insights',
      items: [
        { key: 'analytics', path: '/dashboard', label: 'Analytics', icon: <NavChartIcon /> },
        { key: 'alerts', path: '/alerts', label: 'Alerts', icon: <NavBellIcon /> },
      ],
    },
  ]

  const flatNavItems = navGroups.flatMap((g) => g.items)

  return (
    <div className="dash4-page pfd-shell">
      <aside className={`dash4-sidebar pfd-rail ${isSidebarOpen ? 'open' : 'compact'}`}>
        <div className="pfd-logo">SF</div>
        <nav className="pfd-nav" aria-label="Dashboard navigation">
          {flatNavItems.map((item) => (
            <button
              key={item.key}
              type="button"
              title={item.label}
              className={`pfd-rail-btn ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
            </button>
          ))}
        </nav>
        <button type="button" className="pfd-rail-btn pfd-home-btn" title="Back to homepage" onClick={() => navigate('/')}>
          <NavChartIcon />
        </button>
      </aside>

      <main className="dash4-main">
        <header className="dash4-header">
          <h2>Welcome back, Trader</h2>
          <div className="dash4-header-right">
            <button type="button" className="dash4-pill" onClick={() => setSidebarOpen((prev) => !prev)}>
              Menu
            </button>
            {activeAccount ? <button type="button" className="dash4-pill">{activeAccount.account_name} ▾</button> : <div className="dash4-pill">No account configured</div>}
            {activeAccount ? <div className="dash4-pill dash4-live">Daily Loss Remaining: ${dailyLossRemaining.toLocaleString()}</div> : <div className="dash4-pill">Complete setup to unlock live metrics</div>}
            <div className="dash4-pill">Days Remaining: {daysTimer.days}d {daysTimer.hours}h</div>
            <button
              type="button"
              className="dash4-pill dash4-logout"
              onClick={() => {
                localStorage.removeItem('api_token')
                delete axios.defaults.headers.common.Authorization
                navigate('/login')
              }}
            >
              Logout
            </button>
          </div>
        </header>

        {activeAccount ? (
          <section className="pfd-quick-actions">
            <button
              type="button"
              onClick={() => {
                setShowAddTradeModal(true)
                setActionError(null)
                setActionMessage(null)
              }}
            >
              Add Trade
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCsvModal(true)
                setActionError(null)
                setActionMessage(null)
              }}
            >
              Import CSV
            </button>
            <button type="button" onClick={() => navigate('/trade-log')}>Open Trade Log</button>
          </section>
        ) : null}

        {activeAccount ? (
          <section className="dash4-global-risk">
            <div className="dash4-global-risk-head">
              <strong>Distance to Liquidation</strong>
              <span>{distanceToLiquidation}%</span>
            </div>
            <div className="dash4-global-risk-bar">
              <span style={{ width: `${distanceToLiquidation}%` }} />
            </div>
          </section>
        ) : null}

        {actionMessage ? <div className="dash4-flash dash4-flash-success">{actionMessage}</div> : null}
        {actionError ? <div className="dash4-flash dash4-flash-error">{actionError}</div> : null}
        {activeAccount && riskAlerts.length ? (
          <section className="dash4-risk-list">
            {riskAlerts.map((alert, idx) => (
              <article key={`${alert.text}-${idx}`} className={`dash4-risk-item ${alert.tone}`}>
                <strong>{alert.tone === 'red' ? 'Critical' : alert.tone === 'yellow' ? 'Warning' : 'Safe'}</strong>
                <span>{alert.text}</span>
              </article>
            ))}
          </section>
        ) : null}

        {loading ? (
          <div className="dash-state">Loading dashboard...</div>
        ) : error ? (
          <div className="dash-state dash-error">{error}</div>
        ) : !activeAccount ? (
          <section className="dash4-setup">
            <article className="dash4-setup-card">
              <h3>Step {Math.min(setupDoneCount + 1, setupSteps.length)} of {setupSteps.length}: Connect your first account</h3>
              <p>This is a real onboarding state. No simulated metrics are shown until your firm account and rules are configured.</p>
              <div className="dash4-setup-progress">
                <span style={{ width: `${setupProgress}%` }} />
              </div>
              <div className="dash4-checklist">
                {setupSteps.map((s) => (
                  <div key={s.label} className={s.done ? 'done' : ''}>
                    <span>{s.done ? 'Done' : 'Pending'}</span>
                    <strong>{s.label}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="dash4-setup-card">
              <h3>Create Account & Rules</h3>
              <form className="dash4-setup-form" onSubmit={handleCreateAccount}>
                <label>Firm / Account Name
                  <input value={setupForm.account_name} onChange={setupField('account_name')} placeholder="e.g., FunderPro 10k" required />
                </label>
                <label>Starting Balance
                  <input type="number" min="0" step="0.01" value={setupForm.initial_balance} onChange={setupField('initial_balance')} required />
                </label>
                <label>Profit Target
                  <input type="number" min="0" step="0.01" value={setupForm.profit_target} onChange={setupField('profit_target')} required />
                </label>
                <label>Consistency Rule %
                  <input type="number" min="1" max="100" value={setupForm.consistency_rule_percent} onChange={setupField('consistency_rule_percent')} required />
                </label>
                <label>Daily Drawdown Limit %
                  <input type="number" min="1" max="100" value={setupForm.daily_drawdown_limit_percent} onChange={setupField('daily_drawdown_limit_percent')} required />
                </label>
                <label>Max Loss Limit %
                  <input type="number" min="1" max="100" value={setupForm.max_loss_limit_percent} onChange={setupField('max_loss_limit_percent')} required />
                </label>
                <label>Trade Source
                  <select value={setupForm.trade_source} onChange={setupField('trade_source')} required>
                    <option value="" disabled>Select source...</option>
                    <option value="manual">Manual Entry</option>
                    <option value="mt4">MT4 Sync</option>
                    <option value="mt5">MT5 Sync</option>
                  </select>
                </label>
                <button type="submit" disabled={creatingAccount}>{creatingAccount ? 'Creating...' : 'Create Account'}</button>
              </form>
              {setupMessage ? <p className="dash4-setup-message">{setupMessage}</p> : null}
            </article>

            <article className="dash4-setup-card">
              <h3>What you will see after setup</h3>
              <ul className="dash4-setup-list">
                <li>Total Equity (live)</li>
                <li>Profit Target progress with animated bars</li>
                <li>Real drawdown traffic-light alerts</li>
                <li>Interactive consistency and strategy analytics</li>
                <li>Trades table with search and setup filters</li>
              </ul>
            </article>
          </section>
        ) : (
          <>
            <section className="dash4-metrics">
              <MetricCard
                title="Total Equity"
                value={`€${equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                caption="Live account balance"
                sparkline={sparklinePoints}
              />
              <MetricCard
                title="Profit Target Progress"
                value={`${Math.round(profitProgress)}%`}
                caption={`€${Math.round(totalProfit).toLocaleString()} / €${profitTarget.toLocaleString()}`}
                progress={profitProgress}
                progressColor="#00F2FE"
                animated={animatedBars}
              />
              <MetricCard
                title="Max Daily Drawdown"
                value={`${dailyDrawdownPercent.toFixed(2)}%`}
                caption={`${dailyDrawdownLimitPercent}% max daily rule`}
                progress={dailyDrawdownUsedPct}
                progressColor="#EF4444"
                statusTone={drawdownTone}
                animated={animatedBars}
              />
              <MetricCard
                title="Consistency Score"
                value={`${consistencyPct.toFixed(1)}%`}
                caption={`${consistencyTone === 'red' ? 'Breach Risk' : consistencyTone === 'yellow' ? 'Warning' : 'Safe'} (${consistencyRulePercent}% Rule)`}
                statusTone={consistencyTone}
              />
            </section>

            <section className="dash4-core-grid">
              <div className="dash4-core-left">
                <InteractiveChart data={dailySeries} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
                <div className="dash4-subgrid">
                  <article className="dash4-subcard">
                    <h3>Win Rate by Setup</h3>
                    {strategyBreakdown.length === 0 ? <p className="dash4-empty">No setup data yet.</p> : (
                      <div className="dash4-setup-list">
                        {strategyBreakdown.map((s) => (
                          <div key={s.setup} className="dash4-setup-row">
                            <span>{s.setup}</span>
                            <strong>{s.winRate}%</strong>
                            <small>€{Math.round(s.pnl).toLocaleString()}</small>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                  <article className="dash4-subcard">
                    <h3>Psychology Heatmap</h3>
                    <div className="dash4-heatmap">
                      {heatmapDays.map((d) => (
                        <span
                          key={d.dayKey}
                          className={`dash4-heat-${d.dailyPnl >= 150 ? 'calm' : d.dailyPnl >= 0 ? 'focus' : d.dailyPnl <= -150 ? 'fomo' : 'stress'}`}
                          title={`${dayLabel(d.dayKey)} • ${d.mood.label} • ${d.dailyPnl >= 0 ? '+' : ''}${d.dailyPnl.toLocaleString()}`}
                        />
                      ))}
                    </div>
                  </article>
                </div>
              </div>

              <aside className="dash4-gauge-card">
                <h3>Consistency Gauge</h3>
                <p>Highest Day Profit vs {consistencyRulePercent}% breach threshold</p>
                <label className="dash4-toggle">
                  <span>What-If Simulator: +€{whatIfBoost.toLocaleString()}</span>
                  <input
                    type="range"
                    min="0"
                    max="5000"
                    step="250"
                    value={whatIfBoost}
                    onChange={(e) => setWhatIfBoost(Number(e.target.value))}
                  />
                </label>
                <div className="dash4-ring" style={{ ['--ring-progress']: `${consistencyUsedPct}` }}>
                  <div>
                    <strong>{consistencyPct.toFixed(1)}%</strong>
                    <span>of {consistencyRulePercent}%</span>
                  </div>
                </div>
                <div className={`dash4-badge dash4-${consistencyTone}`}>{consistencyTone === 'red' ? 'Breach Risk' : consistencyTone === 'yellow' ? 'Warning' : 'Safe'}</div>
                <div className="dash4-threshold">
                  <span>Danger Threshold</span>
                  <strong>{consistencyRulePercent}%</strong>
                </div>
                <article className="dash4-strategy-matrix">
                  <h4>Strategy Matrix (ICT)</h4>
                  {ictStrategyMatrix.map((s) => {
                    const expectancy = Number(s.trades || 0) > 0 ? Number(s.pnl || 0) / Number(s.trades) : 0
                    return (
                      <div key={s.setup} className="dash4-matrix-row">
                        <span>{s.setup}</span>
                        <strong>PF {s.profitFactor === 99 ? '∞' : Number(s.profitFactor || 0).toFixed(2)} | EX {expectancy.toFixed(1)}</strong>
                      </div>
                    )
                  })}
                </article>
              </aside>
            </section>

            <section className="dash4-table-card">
              <div className="dash4-table-headline">
                <h3>Recent Trades</h3>
                <div className="dash4-table-filters">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search symbol or setup (e.g., XAUUSD)"
                  />
                  <select value={setupFilter} onChange={(e) => setSetupFilter(e.target.value)}>
                    {setupOptions.map((opt) => <option value={opt} key={opt}>{opt === 'all' ? 'All Setups' : opt}</option>)}
                  </select>
                </div>
              </div>
              <p className="dash4-note">Trade Gallery: click a trade row to attach before/after chart screenshots and logic notes (next enhancement).</p>
              <div className="dash4-trades-head">
                <span>Symbol</span>
                <span>Type</span>
                <span>Lot Size</span>
                <span>PnL</span>
              </div>
              {filteredTrades.length === 0 ? (
                <div className="dash4-empty">No trades match current filters.</div>
              ) : (
                filteredTrades.map((t) => (
                  <div key={t.id} className="dash4-trades-row">
                    <span>{t.symbol || '-'}</span>
                    <span>{String(t.type || '-').toUpperCase()}</span>
                    <span>{Number(t.lot_size || 0).toFixed(2)}</span>
                    <span className={t.pnl >= 0 ? 'dash4-green' : 'dash4-red'}>
                      {t.pnl >= 0 ? '+' : ''}{t.pnl.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </section>
          </>
        )}

        {showAddTradeModal ? (
          <div className="dash4-modal-backdrop" onClick={() => setShowAddTradeModal(false)}>
            <div className="dash4-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Add Trade</h3>
              <form className="dash4-setup-form" onSubmit={handleAddTradeSubmit}>
                <label>Symbol
                  <input value={tradeForm.symbol} onChange={tradeField('symbol')} placeholder="XAUUSD" required />
                </label>
                <label>Type
                  <select value={tradeForm.type} onChange={tradeField('type')}>
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                  </select>
                </label>
                <label>Lot Size
                  <input type="number" min="0" step="0.01" value={tradeForm.lot_size} onChange={tradeField('lot_size')} />
                </label>
                <label>PnL
                  <input type="number" step="0.01" value={tradeForm.pnl} onChange={tradeField('pnl')} placeholder="125.50" required />
                </label>
                <label>Close Time
                  <input type="datetime-local" value={tradeForm.close_time} onChange={tradeField('close_time')} required />
                </label>
                <label>Strategy Tag
                  <input value={tradeForm.strategy_tag} onChange={tradeField('strategy_tag')} placeholder="Silver Bullet" />
                </label>
                <div className="dash4-modal-actions">
                  <button type="button" className="dash4-pill" onClick={() => setShowAddTradeModal(false)}>Cancel</button>
                  <button type="submit" disabled={submittingTrade}>{submittingTrade ? 'Saving...' : 'Save Trade'}</button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {showCsvModal ? (
          <div className="dash4-modal-backdrop" onClick={() => setShowCsvModal(false)}>
            <div className="dash4-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Import MT4/MT5 CSV</h3>
              <form className="dash4-setup-form" onSubmit={handleCsvImportSubmit}>
                <label>CSV File
                  <input type="file" accept=".csv,.txt" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} required />
                </label>
                <small className="dash4-note">Expected headers include symbol, type, pnl, close time or ticket-based format.</small>
                <div className="dash4-modal-actions">
                  <button type="button" className="dash4-pill" onClick={() => setShowCsvModal(false)}>Cancel</button>
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
