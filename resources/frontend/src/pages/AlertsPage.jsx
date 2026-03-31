import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function AlertsPage() {
  const navigate = useNavigate()
  const [account, setAccount] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const a = await axios.get('/accounts')
      const first = a.data.data?.[0] || null
      setAccount(first)
      if (!first) {
        setAlerts([])
        return
      }
      const [alertsRes, metricsRes] = await Promise.all([
        axios.get(`/accounts/${first.id}/alerts`),
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
  }, [])

  const liveStatus = useMemo(() => {
    if (!metrics) return []
    return [
      { label: 'Drawdown Risk', value: `${Number(metrics.drawdownRiskPercentOfLimit || 0).toFixed(1)}% of limit` },
      { label: 'Consistency Risk', value: `${Number(metrics.consistencyRiskPercentOfLimit || 0).toFixed(1)}% of limit` },
      { label: 'Max Loss', value: `${Number(metrics.maxLossPercent || 0).toFixed(2)}% used` },
      { label: 'Status', value: String(metrics.status || 'active') },
    ]
  }, [metrics])

  return (
    <div className="panel-page">
      <header className="panel-top">
        <h1>Alerts</h1>
        <div className="panel-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/trade-log">Trade Log</Link>
          <Link to="/risk-settings">Risk Settings</Link>
        </div>
      </header>

      <section className="panel-card">
        <div className="panel-row">
          <h3>Risk Snapshot</h3>
          <button type="button" onClick={load}>Refresh</button>
        </div>
        {!account ? <p>Create an account first from dashboard setup.</p> : loading ? <p>Loading...</p> : error ? <p className="panel-error">{error}</p> : (
          <div className="panel-grid-mini">
            {liveStatus.map((item) => (
              <div key={item.label} className="mini-stat">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel-card">
        <h3>Alert History</h3>
        {loading ? <p>Loading history...</p> : (
          <div className="panel-table-wrap">
            <table className="panel-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Level</th>
                  <th>Details</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {alerts.length === 0 ? (
                  <tr><td colSpan={4}>No alerts yet. Add/import trades to trigger monitoring alerts.</td></tr>
                ) : alerts.map((a) => (
                  <tr key={a.id}>
                    <td>{a.alert_type}</td>
                    <td className={a.level === 'critical' ? 'pnl-neg' : a.level === 'warning' ? 'warn' : 'pnl-pos'}>{a.level}</td>
                    <td>{a.payload ? JSON.stringify(a.payload) : '-'}</td>
                    <td>{new Date(a.created_at).toLocaleString()}</td>
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

