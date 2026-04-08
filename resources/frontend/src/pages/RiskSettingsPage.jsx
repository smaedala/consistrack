import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import DashboardShell from '../components/DashboardShell'
import { Shield, SlidersHorizontal, Save, Sparkles } from 'lucide-react'

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

  async function load() {
    try {
      setLoading(true)
      const a = await axios.get('/accounts')
      const list = Array.isArray(a.data?.data) ? a.data.data : []
      const preferredId = Number(localStorage.getItem('active_account_id') || 0)
      const preferred = list.find((item) => Number(item.id) === preferredId) || null
      const first = preferred || list[0] || null
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

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    function handleAccountChanged() {
      load()
    }
    window.addEventListener('consistracker:active-account-changed', handleAccountChanged)
    return () => window.removeEventListener('consistracker:active-account-changed', handleAccountChanged)
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

  function applyPreset(type) {
    if (type === 'ftmo') {
      setForm((p) => ({ ...p, daily_drawdown_limit_percent: '5', max_loss_limit_percent: '10', consistency_rule_percent: '40' }))
      setRuleForm((p) => ({ ...p, max_daily_loss_percent: '5', consistency_threshold_percent: '40', consistency_rule_type: '40' }))
      return
    }
    if (type === 'strict') {
      setForm((p) => ({ ...p, daily_drawdown_limit_percent: '3', max_loss_limit_percent: '8', consistency_rule_percent: '20' }))
      setRuleForm((p) => ({ ...p, max_daily_loss_percent: '3', consistency_threshold_percent: '20', consistency_rule_type: 'custom' }))
      return
    }
    if (type === 'flex') {
      setForm((p) => ({ ...p, daily_drawdown_limit_percent: '6', max_loss_limit_percent: '12', consistency_rule_percent: '50' }))
      setRuleForm((p) => ({ ...p, max_daily_loss_percent: '6', consistency_threshold_percent: '50', consistency_rule_type: '40' }))
    }
  }

  const startingBalance = Number(ruleForm.starting_balance || account?.initial_balance || 0)
  const dailyLimitUsd = startingBalance > 0 ? (startingBalance * Number(form.daily_drawdown_limit_percent || 0)) / 100 : 0
  const maxLossUsd = startingBalance > 0 ? (startingBalance * Number(form.max_loss_limit_percent || 0)) / 100 : 0
  const targetUsd = Number(form.profit_target || 0)

  return (
    <DashboardShell>
      <div className="panel-page risk-page">
      <header className="panel-top">
        <div>
          <h1>Risk Settings</h1>
          <p className="trade-log-subtitle">Control your prop-firm rules and safety limits.</p>
        </div>
      </header>

      <section className="risk-presets">
        <button type="button" className="panel-btn panel-btn-soft" onClick={() => applyPreset('ftmo')}>
          <Shield size={14} /> FTMO Style
        </button>
        <button type="button" className="panel-btn panel-btn-soft" onClick={() => applyPreset('strict')}>
          <SlidersHorizontal size={14} /> Strict Risk
        </button>
        <button type="button" className="panel-btn panel-btn-soft" onClick={() => applyPreset('flex')}>
          <Sparkles size={14} /> Flexible
        </button>
      </section>

      <section className="risk-summary-grid">
        <article className="risk-summary-card dash-hover-card">
          <span>Starting Balance</span>
          <strong>${startingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
        </article>
        <article className="risk-summary-card dash-hover-card">
          <span>Profit Target (USD)</span>
          <strong>${targetUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
        </article>
        <article className="risk-summary-card dash-hover-card">
          <span>Daily Loss Buffer</span>
          <strong className="pnl-neg">${dailyLimitUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
        </article>
        <article className="risk-summary-card dash-hover-card">
          <span>Max Loss Buffer</span>
          <strong className="pnl-neg">${maxLossUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
        </article>
      </section>

      {loading ? <p>Loading settings...</p> : (
        <form className="panel-stack risk-form-layout" onSubmit={save}>
          <section className="panel-card dash-hover-card">
          <h3><Shield size={17} /> Account Limits</h3>
          {error ? <p className="panel-error">{error}</p> : null}
          {message ? <p className="panel-success">{message}</p> : null}

          <div className="panel-grid">
            <label>Account Name<input value={form.account_name} onChange={(e) => setForm((p) => ({ ...p, account_name: e.target.value }))} required /><small>Display name for this funded/evaluation account.</small></label>
            <label>Profit Target<input type="number" step="0.01" value={form.profit_target} onChange={(e) => setForm((p) => ({ ...p, profit_target: e.target.value }))} required /><small>Total target profit in USD.</small></label>
            <label>Consistency %<input type="number" step="1" value={form.consistency_rule_percent} onChange={(e) => setForm((p) => ({ ...p, consistency_rule_percent: e.target.value }))} required /><small>Max % allowed for best 24h day.</small></label>
            <label>Daily Drawdown %<input type="number" step="0.1" value={form.daily_drawdown_limit_percent} onChange={(e) => setForm((p) => ({ ...p, daily_drawdown_limit_percent: e.target.value }))} required /><small>Daily loss hard stop percentage.</small></label>
            <label>Max Loss %<input type="number" step="0.1" value={form.max_loss_limit_percent} onChange={(e) => setForm((p) => ({ ...p, max_loss_limit_percent: e.target.value }))} required /><small>Overall account max loss limit.</small></label>
            <label>Timezone<input value={form.timezone} onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))} /><small>Used for daily reset and 24h calculations.</small></label>
          </div>
          </section>

          <section className="panel-card dash-hover-card">
          <h3><SlidersHorizontal size={17} /> Rule Engine</h3>
          <div className="panel-grid">
            <label>Starting Balance<input type="number" step="0.01" value={ruleForm.starting_balance} onChange={(e) => setRuleForm((p) => ({ ...p, starting_balance: e.target.value }))} required /><small>Baseline equity for rule calculations.</small></label>
            <label>Profit Target %<input type="number" step="0.1" value={ruleForm.profit_target_percent} onChange={(e) => setRuleForm((p) => ({ ...p, profit_target_percent: e.target.value }))} required /><small>Progress target as percentage of starting balance.</small></label>
            <label>Max Daily Loss %<input type="number" step="0.1" value={ruleForm.max_daily_loss_percent} onChange={(e) => setRuleForm((p) => ({ ...p, max_daily_loss_percent: e.target.value }))} required /><small>Rule engine daily drawdown limit.</small></label>
            <label>Consistency Type
              <select value={ruleForm.consistency_rule_type} onChange={(e) => setRuleForm((p) => ({ ...p, consistency_rule_type: e.target.value }))}>
                <option value="40">40 Rule</option>
                <option value="15">15 Rule</option>
                <option value="custom">Custom</option>
              </select>
              <small>Framework used for consistency logic.</small>
            </label>
            <label>Consistency Threshold %<input type="number" step="0.1" value={ruleForm.consistency_threshold_percent} onChange={(e) => setRuleForm((p) => ({ ...p, consistency_threshold_percent: e.target.value }))} required /><small>Breach trigger threshold percentage.</small></label>
            <label>Max Single Trade %<input type="number" step="0.1" value={ruleForm.max_single_trade_percent} onChange={(e) => setRuleForm((p) => ({ ...p, max_single_trade_percent: e.target.value }))} /><small>Optional cap per single trade risk.</small></label>
          </div>

          <button type="submit" disabled={saving} className="risk-save-btn">
            <Save size={15} /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
          {rule?.id ? <small>Rule id: {rule.id}</small> : null}
          </section>
        </form>
      )}
      </div>
    </DashboardShell>
  )
}
