import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Bell, AlertTriangle, ShieldCheck, RefreshCw, Clock3, Search, CheckCheck } from 'lucide-react'
import DashboardShell from '../components/DashboardShell'

export default function AlertsPage() {
  const navigate = useNavigate()
  const [account, setAccount] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [levelFilter, setLevelFilter] = useState('')
  const [search, setSearch] = useState('')
  const [includeSnoozed, setIncludeSnoozed] = useState(false)
  const [processingAlertId, setProcessingAlertId] = useState(null)
  const [bulkProcessing, setBulkProcessing] = useState(false)

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const a = await axios.get('/accounts')
      const list = Array.isArray(a.data?.data) ? a.data.data : []
      const preferredId = Number(localStorage.getItem('active_account_id') || 0)
      const preferred = list.find((item) => Number(item.id) === preferredId) || null
      const first = preferred || list[0] || null
      setAccount(first)
      if (!first) {
        setAlerts([])
        return
      }
      const [alertsRes, metricsRes] = await Promise.all([
        axios.get(`/accounts/${first.id}/alerts`, { params: { include_snoozed: includeSnoozed ? 1 : 0 } }),
        axios.get(`/accounts/${first.id}/metrics`),
      ])
      setAlerts(alertsRes.data.data || [])
      setMetrics(metricsRes.data.data || null)
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login')
        return
      }
      setError(err.response?.data?.message || 'Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [includeSnoozed])

  useEffect(() => {
    function handleAccountChanged() {
      load()
    }
    window.addEventListener('consistracker:active-account-changed', handleAccountChanged)
    return () => window.removeEventListener('consistracker:active-account-changed', handleAccountChanged)
  }, [includeSnoozed])

  const liveStatus = useMemo(() => {
    if (!metrics) return []
    return [
      { label: 'Drawdown Risk', value: `${Number(metrics.drawdownRiskPercentOfLimit || 0).toFixed(1)}% of limit` },
      { label: 'Consistency Risk', value: `${Number(metrics.consistencyRiskPercentOfLimit || 0).toFixed(1)}% of limit` },
      { label: 'Max Loss', value: `${Number(metrics.maxLossPercent || 0).toFixed(2)}% used` },
      { label: 'Status', value: String(metrics.status || 'active') },
    ]
  }, [metrics])

  const filteredAlerts = useMemo(() => {
    const levelFiltered = !levelFilter ? alerts : alerts.filter((a) => String(a.level || '') === levelFilter)
    if (!search.trim()) return levelFiltered
    const q = search.trim().toLowerCase()
    return levelFiltered.filter((a) => {
      const text = `${a.alert_type || ''} ${JSON.stringify(a.payload || {})}`.toLowerCase()
      return text.includes(q)
    })
  }, [alerts, levelFilter, search])

  const counts = useMemo(() => {
    return {
      total: alerts.length,
      critical: alerts.filter((a) => String(a.level || '') === 'critical').length,
      warning: alerts.filter((a) => String(a.level || '') === 'warning').length,
      info: alerts.filter((a) => String(a.level || '') === 'info').length,
    }
  }, [alerts])

  async function acknowledgeAlert(alertId) {
    if (!account) return
    try {
      setProcessingAlertId(alertId)
      await axios.patch(`/accounts/${account.id}/alerts/${alertId}/acknowledge`)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to acknowledge alert')
    } finally {
      setProcessingAlertId(null)
    }
  }

  async function snoozeAlert(alertId, minutes = 60) {
    if (!account) return
    try {
      setProcessingAlertId(alertId)
      await axios.patch(`/accounts/${account.id}/alerts/${alertId}/snooze`, { minutes })
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to snooze alert')
    } finally {
      setProcessingAlertId(null)
    }
  }

  async function acknowledgeVisible() {
    if (!account || filteredAlerts.length === 0) return
    try {
      setBulkProcessing(true)
      await Promise.all(filteredAlerts.map((a) => axios.patch(`/accounts/${account.id}/alerts/${a.id}/acknowledge`)))
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to acknowledge visible alerts')
    } finally {
      setBulkProcessing(false)
    }
  }

  function formatLevel(level) {
    const v = String(level || '').toLowerCase()
    if (v === 'critical') return 'Critical'
    if (v === 'warning') return 'Warning'
    return 'Info'
  }

  function prettyType(type) {
    return String(type || '').replaceAll('_', ' ').replace(/\b\w/g, (m) => m.toUpperCase())
  }

  function formatPayload(payload) {
    if (!payload) return '-'
    return Object.entries(payload)
      .slice(0, 3)
      .map(([k, v]) => `${k}: ${typeof v === 'number' ? Number(v).toFixed(2) : String(v)}`)
      .join(' • ')
  }

  return (
    <DashboardShell>
      <div className="panel-page alerts-page">
      <header className="panel-top alerts-top">
        <div>
          <h1 className="alerts-title">
            <Bell size={22} /> Alerts Center
          </h1>
          <p className="alerts-subtitle">Track risk warnings and manage notification flow.</p>
        </div>
      </header>

      <section className="panel-card alerts-card dash-hover-card">
        <div className="alerts-card-head">
          <h3><ShieldCheck size={18} /> Risk Snapshot</h3>
          <button type="button" onClick={load} className="panel-btn panel-btn-ghost dash-hover-control">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
        {!account ? <p>Create an account first from dashboard setup.</p> : loading ? <p>Loading...</p> : error ? <p className="panel-error">{error}</p> : (
          <div className="alerts-snapshot-grid">
            {liveStatus.map((item) => (
              <div key={item.label} className="alerts-stat">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="alerts-summary-grid">
        <button type="button" className="alerts-summary-card dash-hover-card" onClick={() => setLevelFilter('')}>
          <span>Total Alerts</span>
          <strong>{counts.total}</strong>
        </button>
        <button type="button" className="alerts-summary-card critical dash-hover-card" onClick={() => setLevelFilter('critical')}>
          <span>Critical</span>
          <strong>{counts.critical}</strong>
        </button>
        <button type="button" className="alerts-summary-card warning dash-hover-card" onClick={() => setLevelFilter('warning')}>
          <span>Warning</span>
          <strong>{counts.warning}</strong>
        </button>
        <button type="button" className="alerts-summary-card info dash-hover-card" onClick={() => setLevelFilter('info')}>
          <span>Info</span>
          <strong>{counts.info}</strong>
        </button>
      </section>

      <section className="panel-card alerts-card dash-hover-card">
        <h3 className="alerts-history-title"><AlertTriangle size={18} /> Alert History</h3>
        <div className="alerts-controls">
          <div className="alerts-controls-left">
            <label className="alerts-search">
              <Search size={14} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search type or payload..."
                className="panel-input"
              />
            </label>
            <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="panel-input">
              <option value="">All Levels</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
            <label className="alerts-checkbox">
              <input type="checkbox" checked={includeSnoozed} onChange={(e) => setIncludeSnoozed(e.target.checked)} />
              Include snoozed
            </label>
            <button type="button" className="panel-btn panel-btn-neutral dash-hover-control" onClick={acknowledgeVisible} disabled={bulkProcessing || filteredAlerts.length === 0}>
              <CheckCheck size={14} /> {bulkProcessing ? 'Updating...' : 'Acknowledge Visible'}
            </button>
          </div>
        </div>
        {loading ? <p>Loading history...</p> : (
          <>
          <div className="panel-table-wrap alerts-table-desktop">
            <table className="panel-table alerts-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Level</th>
                  <th>Details</th>
                  <th>Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.length === 0 ? (
                  <tr><td colSpan={5} className="alerts-empty">No alerts yet. Add/import trades to trigger monitoring alerts.</td></tr>
                ) : filteredAlerts.map((a) => (
                  <tr key={a.id}>
                    <td>{prettyType(a.alert_type)}</td>
                    <td>
                      <span className={`alerts-badge ${String(a.level || '').toLowerCase()}`}>{formatLevel(a.level)}</span>
                    </td>
                    <td className="alerts-details">
                      {formatPayload(a.payload)}
                    </td>
                    <td className="alerts-time">
                      <span>
                        <Clock3 size={13} /> {new Date(a.created_at).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <div className="alerts-actions">
                        <button
                          type="button"
                          className="panel-btn panel-btn-neutral dash-hover-control"
                          disabled={processingAlertId === a.id}
                          onClick={() => acknowledgeAlert(a.id)}
                        >
                          Ack
                        </button>
                        <button
                          type="button"
                          className="panel-btn panel-btn-soft dash-hover-control"
                          disabled={processingAlertId === a.id}
                          onClick={() => snoozeAlert(a.id, 60)}
                        >
                          Snooze 1h
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="alerts-cards-mobile">
            {filteredAlerts.length === 0 ? (
              <p className="alerts-empty">No alerts yet. Add/import trades to trigger monitoring alerts.</p>
            ) : filteredAlerts.map((a) => (
              <article key={a.id} className="alerts-mobile-card dash-hover-card">
                <div className="alerts-mobile-row">
                  <strong>{prettyType(a.alert_type)}</strong>
                  <span className={`alerts-badge ${String(a.level || '').toLowerCase()}`}>{formatLevel(a.level)}</span>
                </div>
                <p className="alerts-mobile-details">{formatPayload(a.payload)}</p>
                <p className="alerts-mobile-time"><Clock3 size={13} /> {new Date(a.created_at).toLocaleString()}</p>
                <div className="alerts-actions">
                  <button
                    type="button"
                    className="panel-btn panel-btn-neutral dash-hover-control"
                    disabled={processingAlertId === a.id}
                    onClick={() => acknowledgeAlert(a.id)}
                  >
                    Ack
                  </button>
                  <button
                    type="button"
                    className="panel-btn panel-btn-soft dash-hover-control"
                    disabled={processingAlertId === a.id}
                    onClick={() => snoozeAlert(a.id, 60)}
                  >
                    Snooze 1h
                  </button>
                </div>
              </article>
            ))}
          </div>
          </>
        )}
      </section>
      </div>
    </DashboardShell>
  )
}
