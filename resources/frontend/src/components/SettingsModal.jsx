import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function SettingsModal({ accountId, onClose, onSave }) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    starting_balance: 100000,
    profit_target_percent: 10,
    max_daily_loss_percent: 5,
    consistency_rule_type: '40',
    consistency_threshold_percent: 40,
    max_single_trade_percent: null,
  })

  useEffect(() => {
    if (!accountId) return
    setLoading(true)
    axios
      .get(`/accounts/${accountId}/rules`)
      .then((res) => {
        setForm({
          starting_balance: Number(res.data.data.starting_balance || 100000),
          profit_target_percent: Number(res.data.data.profit_target_percent || 10),
          max_daily_loss_percent: Number(res.data.data.max_daily_loss_percent || 5),
          consistency_rule_type: res.data.data.consistency_rule_type || '40',
          consistency_threshold_percent: Number(res.data.data.consistency_threshold_percent || 40),
          max_single_trade_percent: res.data.data.max_single_trade_percent || null,
        })
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load rules'))
      .finally(() => setLoading(false))
  }, [accountId])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: name === 'consistency_rule_type' ? value : parseFloat(value) || value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    axios
      .post('/rules', {
        trading_account_id: accountId,
        ...form,
      })
      .then((res) => {
        if (onSave) onSave(res.data.data)
        onClose()
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to save rules'))
      .finally(() => setSaving(false))
  }

  if (loading) {
    return (
      <div className="settings-overlay">
        <div className="settings-modal">
          <p>Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>Trading Rules Configuration</h2>
          <button type="button" className="settings-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="settings-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="settings-group">
            <label>Starting Balance (€)</label>
            <input
              type="number"
              name="starting_balance"
              value={form.starting_balance}
              onChange={handleChange}
              min="1000"
              step="100"
              required
            />
            <small>Your account opening balance</small>
          </div>

          <div className="settings-row">
            <div className="settings-group">
              <label>Profit Target (%)</label>
              <input
                type="number"
                name="profit_target_percent"
                value={form.profit_target_percent}
                onChange={handleChange}
                min="0.1"
                max="100"
                step="0.5"
                required
              />
              <small>Target profit as % of starting balance</small>
            </div>

            <div className="settings-group">
              <label>Max Daily Loss (%)</label>
              <input
                type="number"
                name="max_daily_loss_percent"
                value={form.max_daily_loss_percent}
                onChange={handleChange}
                min="0.1"
                max="100"
                step="0.5"
                required
              />
              <small>Max daily loss as % of starting balance</small>
            </div>
          </div>

          <div className="settings-divider" />

          <div className="settings-group">
            <label>Consistency Rule Type</label>
            <select
              name="consistency_rule_type"
              value={form.consistency_rule_type}
              onChange={handleChange}
              required
            >
              <option value="40">40% Rule (Highest Day &lt; 40% of Total)</option>
              <option value="15">15% Rule (Highest Day &lt; 15% of Total)</option>
              <option value="custom">Custom Threshold</option>
            </select>
            <small>Highest daily profit cannot exceed this % of total profit</small>
          </div>

          <div className="settings-group">
            <label>Consistency Threshold (%)</label>
            <input
              type="number"
              name="consistency_threshold_percent"
              value={form.consistency_threshold_percent}
              onChange={handleChange}
              min="0.1"
              max="100"
              step="1"
              required
            />
            <small>Percent threshold for consistency breach detection</small>
          </div>

          <div className="settings-group">
            <label>Max Single Trade (%) - Optional</label>
            <input
              type="number"
              name="max_single_trade_percent"
              value={form.max_single_trade_percent || ''}
              onChange={handleChange}
              min="0.1"
              max="100"
              step="0.5"
              placeholder="Leave blank for no limit"
            />
            <small>Max risk per single trade as % of starting balance</small>
          </div>

          <div className="settings-actions">
            <button type="button" className="settings-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="settings-save" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
