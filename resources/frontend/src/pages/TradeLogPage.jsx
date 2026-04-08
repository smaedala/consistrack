import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import DashboardShell from '../components/DashboardShell'
import { Search, Filter, Calendar, FileDown, TrendingUp, TrendingDown, Wallet, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'

function toCsv(rows) {
  const header = ['symbol', 'type', 'lot_size', 'strategy_tag', 'pnl', 'close_time']
  const lines = [header.join(',')]
  rows.forEach((r) => {
    const line = [
      r.symbol || '',
      r.type || '',
      r.lot_size ?? '',
      r.strategy_tag || '',
      r.pnl ?? '',
      r.close_time || '',
    ].map((v) => `"${String(v).replaceAll('"', '""')}"`)
    lines.push(line.join(','))
  })
  return lines.join('\n')
}

export default function TradeLogPage() {
  const navigate = useNavigate()
  const [account, setAccount] = useState(null)
  const [trades, setTrades] = useState([])
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 20, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [symbolFilter, setSymbolFilter] = useState('')
  const [strategyFilter, setStrategyFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [pnlFilter, setPnlFilter] = useState('')
  const [sortFilter, setSortFilter] = useState('close_time_desc')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [perPage, setPerPage] = useState(20)
  const [page, setPage] = useState(1)

  async function load(accountOverride = null, pageOverride = page) {
    try {
      setLoading(true)
      const accounts = await axios.get('/accounts')
      const list = Array.isArray(accounts.data?.data) ? accounts.data.data : []
      const preferredId = Number(localStorage.getItem('active_account_id') || 0)
      const preferred = list.find((a) => Number(a.id) === preferredId) || null
      const first = accountOverride || preferred || list[0] || null
      setAccount(first)
      if (!first) {
        setTrades([])
        setPagination({ current_page: 1, last_page: 1, per_page: 20, total: 0 })
        return
      }
      const t = await axios.get(`/accounts/${first.id}/dashboard/recent-trades`, {
        params: {
          page: pageOverride,
          per_page: perPage,
          q: search || undefined,
          symbol: symbolFilter || undefined,
          strategy_tag: strategyFilter || undefined,
          type: typeFilter || undefined,
          pnl: pnlFilter || undefined,
          sort: sortFilter || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        },
      })
      const payload = t.data.data || {}
      const items = payload.data || []
      setTrades(Array.isArray(items) ? items : [])
      setPagination({
        current_page: Number(payload.current_page || 1),
        last_page: Number(payload.last_page || 1),
        per_page: Number(payload.per_page || 20),
        total: Number(payload.total || 0),
      })
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login')
        return
      }
      setError(err.response?.data?.message || 'Failed to load trade log')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [page, search, symbolFilter, strategyFilter, typeFilter, pnlFilter, sortFilter, dateFrom, dateTo, perPage])

  useEffect(() => {
    function handleAccountChanged() {
      setPage(1)
      load(null, 1)
    }
    window.addEventListener('consistracker:active-account-changed', handleAccountChanged)
    return () => window.removeEventListener('consistracker:active-account-changed', handleAccountChanged)
  }, [])

  const filtered = useMemo(() => trades, [trades])
  const overview = useMemo(() => {
    const total = filtered.length
    const wins = filtered.filter((t) => Number(t.pnl) >= 0).length
    const losses = Math.max(0, total - wins)
    const net = filtered.reduce((sum, t) => sum + Number(t.pnl || 0), 0)
    const avgWin = wins > 0 ? filtered.filter((t) => Number(t.pnl) >= 0).reduce((sum, t) => sum + Number(t.pnl || 0), 0) / wins : 0
    const avgLoss = losses > 0 ? filtered.filter((t) => Number(t.pnl) < 0).reduce((sum, t) => sum + Number(t.pnl || 0), 0) / losses : 0
    const symbolMap = filtered.reduce((acc, t) => {
      const symbol = String(t.symbol || 'Unknown')
      acc[symbol] = (acc[symbol] || 0) + Number(t.pnl || 0)
      return acc
    }, {})
    const strategyMap = filtered.reduce((acc, t) => {
      const tag = String(t.strategy_tag || 'General')
      acc[tag] = (acc[tag] || 0) + 1
      return acc
    }, {})
    const bestSymbol = Object.entries(symbolMap).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || '-'
    const topStrategy = Object.entries(strategyMap).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || '-'
    return { total, wins, losses, net, avgWin, avgLoss, bestSymbol, topStrategy }
  }, [filtered])

  async function exportCsv() {
    if (!account) return
    const res = await axios.get(`/accounts/${account.id}/dashboard/recent-trades`, {
      params: {
        page: 1,
        per_page: 500,
        q: search || undefined,
        symbol: symbolFilter || undefined,
        strategy_tag: strategyFilter || undefined,
        type: typeFilter || undefined,
        pnl: pnlFilter || undefined,
        sort: sortFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      },
    })
    const csvRows = Array.isArray(res.data?.data?.data) ? res.data.data.data : filtered
    const blob = new Blob([toCsv(csvRows)], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'trade-log.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function applyDatePreset(preset) {
    const now = new Date()
    const yyyyMmDd = (d) => d.toISOString().slice(0, 10)
    if (preset === 'today') {
      setDateFrom(yyyyMmDd(now))
      setDateTo(yyyyMmDd(now))
      setPage(1)
      return
    }
    const start = new Date(now)
    if (preset === '7d') start.setDate(now.getDate() - 6)
    if (preset === '30d') start.setDate(now.getDate() - 29)
    if (preset === 'month') start.setDate(1)
    setDateFrom(yyyyMmDd(start))
    setDateTo(yyyyMmDd(now))
    setPage(1)
  }

  return (
    <DashboardShell>
      <div className="panel-page trade-log-page">
      <header className="panel-top">
        <div>
          <h1>Trade Log</h1>
          <p className="trade-log-subtitle">Review, filter, and export your trading history.</p>
        </div>
      </header>

      <section className="trade-log-overview">
        <div className="trade-log-overview-card dash-hover-card">
          <span><Wallet size={15} /> Active Account</span>
          <strong>{account?.account_name || 'No Account Yet'}</strong>
        </div>
        <div className="trade-log-overview-card dash-hover-card">
          <span><Filter size={15} /> Filtered Trades</span>
          <strong>{overview.total}</strong>
        </div>
        <div className="trade-log-overview-card dash-hover-card">
          <span><TrendingUp size={15} /> Winning Trades</span>
          <strong className="pnl-pos">{overview.wins}</strong>
        </div>
        <div className="trade-log-overview-card dash-hover-card">
          <span><TrendingDown size={15} /> Losing Trades</span>
          <strong className="pnl-neg">{overview.losses}</strong>
        </div>
        <div className="trade-log-overview-card dash-hover-card">
          <span><Wallet size={15} /> Net PnL (Visible)</span>
          <strong className={overview.net >= 0 ? 'pnl-pos' : 'pnl-neg'}>
            {overview.net >= 0 ? '+' : '-'}${Math.abs(overview.net).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </strong>
        </div>
        <div className="trade-log-overview-card dash-hover-card">
          <span><TrendingUp size={15} /> Average Win</span>
          <strong className="pnl-pos">+${Math.abs(overview.avgWin).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
        </div>
        <div className="trade-log-overview-card dash-hover-card">
          <span><TrendingDown size={15} /> Average Loss</span>
          <strong className="pnl-neg">-${Math.abs(overview.avgLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
        </div>
        <div className="trade-log-overview-card dash-hover-card">
          <span><Filter size={15} /> Best Symbol</span>
          <strong>{overview.bestSymbol}</strong>
        </div>
        <div className="trade-log-overview-card dash-hover-card">
          <span><Filter size={15} /> Top Strategy</span>
          <strong>{overview.topStrategy}</strong>
        </div>
      </section>

      <section className="panel-card trade-log-card dash-hover-card">
        <div className="panel-row">
          <h3><Search size={18} /> Trades</h3>
          <div className="panel-actions trade-log-actions">
            <button type="button" className="panel-btn panel-btn-neutral dash-hover-control trade-log-export-btn" onClick={exportCsv}>
              <FileDown size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
        <div className="trade-log-presets">
          <span>Quick Range:</span>
          <button type="button" className="panel-btn panel-btn-soft dash-hover-control" onClick={() => applyDatePreset('today')}>Today</button>
          <button type="button" className="panel-btn panel-btn-soft dash-hover-control" onClick={() => applyDatePreset('7d')}>Last 7D</button>
          <button type="button" className="panel-btn panel-btn-soft dash-hover-control" onClick={() => applyDatePreset('30d')}>Last 30D</button>
          <button type="button" className="panel-btn panel-btn-soft dash-hover-control" onClick={() => applyDatePreset('month')}>This Month</button>
        </div>
        <div className="trade-log-filters-grid">
          <input placeholder="Search symbol/setup/type" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value) }} />
          <input placeholder="Symbol" value={symbolFilter} onChange={(e) => { setPage(1); setSymbolFilter(e.target.value) }} />
          <input placeholder="Strategy" value={strategyFilter} onChange={(e) => { setPage(1); setStrategyFilter(e.target.value) }} />
          <select value={typeFilter} onChange={(e) => { setPage(1); setTypeFilter(e.target.value) }}>
            <option value="">All Types</option>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
          <select value={pnlFilter} onChange={(e) => { setPage(1); setPnlFilter(e.target.value) }}>
            <option value="">All PnL</option>
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
          </select>
          <select value={sortFilter} onChange={(e) => { setPage(1); setSortFilter(e.target.value) }}>
            <option value="close_time_desc">Newest</option>
            <option value="close_time_asc">Oldest</option>
            <option value="pnl_desc">PnL High-Low</option>
            <option value="pnl_asc">PnL Low-High</option>
          </select>
          <label className="trade-log-date-field">
            <Calendar size={14} />
            <input type="date" value={dateFrom} onChange={(e) => { setPage(1); setDateFrom(e.target.value) }} />
          </label>
          <label className="trade-log-date-field">
            <Calendar size={14} />
            <input type="date" value={dateTo} onChange={(e) => { setPage(1); setDateTo(e.target.value) }} />
          </label>
          <button
            type="button"
            className="panel-btn panel-btn-soft dash-hover-control"
            onClick={() => {
              setPage(1)
              setSearch('')
              setSymbolFilter('')
              setStrategyFilter('')
              setTypeFilter('')
              setPnlFilter('')
              setSortFilter('close_time_desc')
              setDateFrom('')
              setDateTo('')
            }}
          >
            <RotateCcw size={14} />
            Reset Filters
          </button>
          <select value={perPage} className="trade-log-per-page" onChange={(e) => { setPage(1); setPerPage(Number(e.target.value) || 20) }}>
            <option value={8}>8 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
          <div className="trade-log-filter-summary">
            Showing page {pagination.current_page} of {pagination.last_page} ({pagination.total} trades)
          </div>
        </div>

        {loading ? <p>Loading...</p> : error ? <p className="panel-error">{error}</p> : (
          <>
          <div className="panel-table-wrap trade-log-table-desktop">
            <table className="panel-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Type</th>
                  <th>Lot</th>
                  <th>Setup</th>
                  <th>PnL</th>
                  <th>Close Time</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="trade-log-empty">
                      No trades match current filters. Try reset filters or add/import trades from dashboard actions.
                    </td>
                  </tr>
                ) : filtered.map((t) => (
                  <tr key={t.id}>
                    <td>{t.symbol}</td>
                    <td>
                      <span className={`trade-log-type ${String(t.type || '').toLowerCase() === 'buy' ? 'buy' : 'sell'}`}>
                        {String(t.type || '').toUpperCase()}
                      </span>
                    </td>
                    <td>{t.lot_size}</td>
                    <td>{t.strategy_tag || 'General'}</td>
                    <td className={Number(t.pnl) >= 0 ? 'pnl-pos' : 'pnl-neg'}>
                      {Number(t.pnl) >= 0 ? '+' : '-'}${Math.abs(Number(t.pnl)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td>{new Date(t.close_time).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="trade-log-cards-mobile">
            {filtered.length === 0 ? (
              <article className="trade-log-mobile-card">
                <p className="trade-log-empty">No trades found for this filter set.</p>
              </article>
            ) : filtered.map((t) => (
              <article key={t.id} className="trade-log-mobile-card">
                <div className="trade-log-mobile-row">
                  <strong>{t.symbol}</strong>
                  <span className={`trade-log-type ${String(t.type || '').toLowerCase() === 'buy' ? 'buy' : 'sell'}`}>
                    {String(t.type || '').toUpperCase()}
                  </span>
                </div>
                <div className="trade-log-mobile-row">
                  <span>Lot: {t.lot_size}</span>
                  <span className={Number(t.pnl) >= 0 ? 'pnl-pos' : 'pnl-neg'}>
                    {Number(t.pnl) >= 0 ? '+' : '-'}${Math.abs(Number(t.pnl)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="trade-log-mobile-meta">{t.strategy_tag || 'General'}</div>
                <div className="trade-log-mobile-meta">{new Date(t.close_time).toLocaleString()}</div>
              </article>
            ))}
          </div>
          </>
        )}
        <div className="panel-row trade-log-pagination-row">
          <p className="trade-log-pagination-text">Page {pagination.current_page} / {pagination.last_page}</p>
          <div className="panel-actions">
            <button type="button" className="panel-btn panel-btn-soft dash-hover-control" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft size={14} />
              Previous
            </button>
            <button type="button" className="panel-btn panel-btn-soft dash-hover-control" disabled={page >= pagination.last_page} onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}>
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </section>
      </div>
    </DashboardShell>
  )
}
