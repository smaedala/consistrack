import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function RiskSettingsPage() {
  const navigate = useNavigate()
  const [account, setAccount] = useState(null)
  const [rule, setRule] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    account_name: '',
    profit_target: '',
    consistency_rule_percent: '',
    daily_drawdown_limit_percent: '',
    max_loss_limit_percent: '',
    timezone: 'UTC',
  })
  const [ruleForm, setRuleForm] = useState({
    starting_balance: '',
    profit_target_percent: '',
    max_daily_loss_percent: '',
    consistency_rule_type: '40',
    consistency_threshold_percent: '',
    max_single_trade_percent: '',
  })

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const a = await axios.get('/accounts')
        const first = a.data.data?.[0] || null
        setAccount(first)
        if (!first) return

        setForm({
          account_name: first.account_name || '',
          profit_target: String(first.profit_target ?? ''),
          consistency_rule_percent: String(first.consistency_rule_percent ?? ''),
          daily_drawdown_limit_percent: String(first.daily_drawdown_limit_percent ?? ''),
          max_loss_limit_percent: String(first.max_loss_limit_percent ?? ''),
          timezone: first.timezone || 'UTC',
        })

        const r = await axios.get(`/accounts/${first.id}/rules`)
        const data = r.data.data || {}
        setRule(data)
        setRuleForm({
          starting_balance: String(data.starting_balance ?? first.initial_balance ?? ''),
          profit_target_percent: String(data.profit_target_percent ?? 10),
          max_daily_loss_percent: String(data.max_daily_loss_percent ?? first.daily_drawdown_limit_percent ?? 5),
          consistency_rule_type: String(data.consistency_rule_type ?? '40'),
          consistency_threshold_percent: String(data.consistency_threshold_percent ?? first.consistency_rule_percent ?? 40),
          max_single_trade_percent: String(data.max_single_trade_percent ?? ''),
        })
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/login')
          return
        }
        setError(err.response?.data?.message || 'Failed to load risk settings')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function save(e) {
    e.preventDefault()
    if (!account) {
      setError('No account found. Create one in dashboard first.')
      return
    }
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      await axios.patch(`/accounts/${account.id}`, {
        account_name: form.account_name,
        profit_target: Number(form.profit_target),
        consistency_rule_percent: Number(form.consistency_rule_percent),
        daily_drawdown_limit_percent: Number(form.daily_drawdown_limit_percent),
        max_loss_limit_percent: Number(form.max_loss_limit_percent),
        timezone: form.timezone,
      })

      await axios.post('/rules', {
        trading_account_id: account.id,
        starting_balance: Number(ruleForm.starting_balance),
        profit_target_percent: Number(ruleForm.profit_target_percent),
        max_daily_loss_percent: Number(ruleForm.max_daily_loss_percent),
        consistency_rule_type: ruleForm.consistency_rule_type,
        consistency_threshold_percent: Number(ruleForm.consistency_threshold_percent),
        max_single_trade_percent: ruleForm.max_single_trade_percent ? Number(ruleForm.max_single_trade_percent) : null,
      })

      setMessage('Risk settings saved successfully.')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save risk settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="panel-page">
      <header className="panel-top">
        <h1>Risk Settings</h1>
        <div className="panel-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/trade-log">Trade Log</Link>
          <Link to="/alerts">Alerts</Link>
        </div>
      </header>

      {loading ? <p>Loading settings...</p> : (
        <form className="panel-card panel-stack" onSubmit={save}>
          <h3>Account Limits</h3>
          {error ? <p className="panel-error">{error}</p> : null}
          {message ? <p className="panel-success">{message}</p> : null}

          <div className="panel-grid">
            <label>Account Name<input value={form.account_name} onChange={(e) => setForm((p) => ({ ...p, account_name: e.target.value }))} required /></label>
            <label>Profit Target<input type="number" step="0.01" value={form.profit_target} onChange={(e) => setForm((p) => ({ ...p, profit_target: e.target.value }))} required /></label>
            <label>Consistency %<input type="number" step="1" value={form.consistency_rule_percent} onChange={(e) => setForm((p) => ({ ...p, consistency_rule_percent: e.target.value }))} required /></label>
            <label>Daily Drawdown %<input type="number" step="0.1" value={form.daily_drawdown_limit_percent} onChange={(e) => setForm((p) => ({ ...p, daily_drawdown_limit_percent: e.target.value }))} required /></label>
            <label>Max Loss %<input type="number" step="0.1" value={form.max_loss_limit_percent} onChange={(e) => setForm((p) => ({ ...p, max_loss_limit_percent: e.target.value }))} required /></label>
            <label>Timezone<input value={form.timezone} onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))} /></label>
          </div>

          <h3>Rule Engine</h3>
          <div className="panel-grid">
            <label>Starting Balance<input type="number" step="0.01" value={ruleForm.starting_balance} onChange={(e) => setRuleForm((p) => ({ ...p, starting_balance: e.target.value }))} required /></label>
            <label>Profit Target %<input type="number" step="0.1" value={ruleForm.profit_target_percent} onChange={(e) => setRuleForm((p) => ({ ...p, profit_target_percent: e.target.value }))} required /></label>
            <label>Max Daily Loss %<input type="number" step="0.1" value={ruleForm.max_daily_loss_percent} onChange={(e) => setRuleForm((p) => ({ ...p, max_daily_loss_percent: e.target.value }))} required /></label>
            <label>Consistency Type
              <select value={ruleForm.consistency_rule_type} onChange={(e) => setRuleForm((p) => ({ ...p, consistency_rule_type: e.target.value }))}>
                <option value="40">40 Rule</option>
                <option value="15">15 Rule</option>
                <option value="custom">Custom</option>
              </select>
            </label>
            <label>Consistency Threshold %<input type="number" step="0.1" value={ruleForm.consistency_threshold_percent} onChange={(e) => setRuleForm((p) => ({ ...p, consistency_threshold_percent: e.target.value }))} required /></label>
            <label>Max Single Trade %<input type="number" step="0.1" value={ruleForm.max_single_trade_percent} onChange={(e) => setRuleForm((p) => ({ ...p, max_single_trade_percent: e.target.value }))} /></label>
          </div>

          <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</button>
          {rule?.id ? <small>Rule id: {rule.id}</small> : null}
        </form>
      )}
    </div>
  )
}

