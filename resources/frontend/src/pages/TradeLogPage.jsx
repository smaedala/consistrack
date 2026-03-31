import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    symbol: '',
    type: 'buy',
    lot_size: '0.10',
    strategy_tag: '',
    pnl: '',
    close_time: new Date().toISOString().slice(0, 16),
  })

  async function load() {
    try {
      setLoading(true)
      const accounts = await axios.get('/accounts')
      const first = accounts.data.data?.[0] || null
      setAccount(first)
      if (!first) {
        setTrades([])
        return
      }
      const t = await axios.get(`/accounts/${first.id}/trades`)
      const items = t.data.data.data || t.data.data || []
      setTrades(Array.isArray(items) ? items : [])
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
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return trades
    return trades.filter((t) =>
      String(t.symbol || '').toLowerCase().includes(q) ||
      String(t.strategy_tag || '').toLowerCase().includes(q) ||
      String(t.type || '').toLowerCase().includes(q)
    )
  }, [search, trades])

  async function submitTrade(e) {
    e.preventDefault()
    if (!account) return
    setSubmitting(true)
    setError(null)
    try {
      await axios.post(`/accounts/${account.id}/trades`, {
        symbol: form.symbol.trim().toUpperCase(),
        type: form.type,
        lot_size: Number(form.lot_size || 0),
        strategy_tag: form.strategy_tag || null,
        pnl: Number(form.pnl),
        close_time: new Date(form.close_time).toISOString(),
      })
      setForm((prev) => ({ ...prev, symbol: '', strategy_tag: '', pnl: '' }))
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save trade')
    } finally {
      setSubmitting(false)
    }
  }

  function exportCsv() {
    const blob = new Blob([toCsv(filtered)], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'trade-log.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="panel-page">
      <header className="panel-top">
        <h1>Trade Log</h1>
        <div className="panel-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/risk-settings">Risk Settings</Link>
          <Link to="/alerts">Alerts</Link>
        </div>
      </header>

      <section className="panel-card">
        <h3>Quick Add Trade</h3>
        {!account ? <p>Create an account first from Dashboard setup.</p> : (
          <form className="panel-form" onSubmit={submitTrade}>
            <input placeholder="Symbol" value={form.symbol} onChange={(e) => setForm((p) => ({ ...p, symbol: e.target.value }))} required />
            <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
            <input type="number" step="0.01" value={form.lot_size} onChange={(e) => setForm((p) => ({ ...p, lot_size: e.target.value }))} />
            <input placeholder="Setup tag" value={form.strategy_tag} onChange={(e) => setForm((p) => ({ ...p, strategy_tag: e.target.value }))} />
            <input type="number" step="0.01" placeholder="PnL" value={form.pnl} onChange={(e) => setForm((p) => ({ ...p, pnl: e.target.value }))} required />
            <input type="datetime-local" value={form.close_time} onChange={(e) => setForm((p) => ({ ...p, close_time: e.target.value }))} required />
            <button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Add Trade'}</button>
          </form>
        )}
      </section>

      <section className="panel-card">
        <div className="panel-row">
          <h3>Trades</h3>
          <div className="panel-actions">
            <input placeholder="Search symbol/setup/type" value={search} onChange={(e) => setSearch(e.target.value)} />
            <button type="button" onClick={exportCsv}>Export CSV</button>
          </div>
        </div>

        {loading ? <p>Loading...</p> : error ? <p className="panel-error">{error}</p> : (
          <div className="panel-table-wrap">
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
                {filtered.map((t) => (
                  <tr key={t.id}>
                    <td>{t.symbol}</td>
                    <td>{String(t.type || '').toUpperCase()}</td>
                    <td>{t.lot_size}</td>
                    <td>{t.strategy_tag || 'General'}</td>
                    <td className={Number(t.pnl) >= 0 ? 'pnl-pos' : 'pnl-neg'}>{Number(t.pnl) >= 0 ? '+' : ''}{Number(t.pnl).toLocaleString()}</td>
                    <td>{new Date(t.close_time).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

