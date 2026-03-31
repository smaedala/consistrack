import React, { useMemo } from 'react'
import axios from 'axios'

export default function MultiAccountComparison({ accounts, metrics, rules }) {
  if (!accounts || accounts.length === 0) {
    return (
      <div className="multi-account-empty">
        <p>No trading accounts yet. Create one to get started.</p>
      </div>
    )
  }

  const accountStats = useMemo(() => {
    return accounts.map((account) => {
      const accountMetrics = metrics?.[account.id] || {}
      const accountRules = rules?.[account.id]
      const equity = Number(accountMetrics.currentBalance || accountRules?.starting_balance || 100000)
      const totalProfit = equity - (accountRules?.starting_balance || 100000)
      const profitTarget = accountRules?.starting_balance ? (accountRules.starting_balance * accountRules.profit_target_percent) / 100 : 10000
      const maxDailyLoss = accountRules?.starting_balance ? (accountRules.starting_balance * accountRules.max_daily_loss_percent) / 100 : 5000

      return {
        id: account.id,
        name: account.name || 'Account ' + account.id,
        equity,
        totalProfit,
        profitTarget,
        profitProgress: (totalProfit / profitTarget) * 100,
        maxDailyLoss,
        maxConsistency: accountRules?.consistency_threshold_percent || 40,
        topDayPercent: Number(accountMetrics.topDailyPercentOfTarget || 0),
        consistencyStatus: Number(accountMetrics.topDailyPercentOfTarget || 0) > (accountRules?.consistency_threshold_percent || 40) ? 'breach' : Number(accountMetrics.topDailyPercentOfTarget || 0) > (accountRules?.consistency_threshold_percent || 40) * 0.8 ? 'warning' : 'safe',
        status: account.status || 'active',
      }
    })
  }, [accounts, metrics, rules])

  const sortedByRisk = useMemo(() => {
    return [...accountStats].sort((a, b) => {
      const riskScore = (acc) => {
        if (acc.consistencyStatus === 'breach') return 100
        if (acc.consistencyStatus === 'warning') return 50
        return 0
      }
      return riskScore(b) - riskScore(a)
    })
  }, [accountStats])

  const stats = useMemo(() => {
    return {
      totalAccounts: accountStats.length,
      breachRiskCount: accountStats.filter((a) => a.consistencyStatus === 'breach').length,
      warningCount: accountStats.filter((a) => a.consistencyStatus === 'warning').length,
      aggregateEquity: accountStats.reduce((sum, a) => sum + a.equity, 0),
      aggregateProfit: accountStats.reduce((sum, a) => sum + a.totalProfit, 0),
    }
  }, [accountStats])

  return (
    <div className="multi-account">
      <div className="multi-account-header">
        <h2>Global Performance</h2>
        <p>Real-time view of all trading accounts</p>
      </div>

      <div className="multi-account-summary">
        <div className="summary-card">
          <div className="summary-label">Total Accounts</div>
          <div className="summary-value">{stats.totalAccounts}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Aggregate Equity</div>
          <div className="summary-value">€{stats.aggregateEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Total Profit</div>
          <div className="summary-value" style={{ color: stats.aggregateProfit >= 0 ? '#6ee7b7' : '#fca5a5' }}>
            {stats.aggregateProfit >= 0 ? '+' : ''}€{Math.abs(stats.aggregateProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        {(stats.breachRiskCount > 0 || stats.warningCount > 0) && (
          <div className="summary-card alert">
            <div className="summary-label">⚠️ At Risk</div>
            <div className="summary-value">
              {stats.breachRiskCount} Breach {stats.warningCount > 0 ? `+ ${stats.warningCount} Warning` : ''}
            </div>
          </div>
        )}
      </div>

      <div className="multi-account-grid">
        {sortedByRisk.map((account) => (
          <div key={account.id} className={`account-card account-${account.consistencyStatus}`}>
            <div className="account-header">
              <h3>{account.name}</h3>
              <span className={`account-badge account-${account.consistencyStatus}`}>
                {account.consistencyStatus === 'breach' ? '🔴 Breach' : account.consistencyStatus === 'warning' ? '🟡 Warning' : '🟢 Safe'}
              </span>
            </div>

            <div className="account-stats">
              <div className="stat-row">
                <span className="stat-label">Equity</span>
                <strong>€{account.equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </div>

              <div className="stat-row">
                <span className="stat-label">Profit / Target</span>
                <strong className={account.totalProfit >= 0 ? 'green' : 'red'}>
                  €{account.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} / €{account.profitTarget.toLocaleString()}
                </strong>
              </div>

              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${Math.min(100, account.profitProgress)}%` }} />
              </div>

              <div className="stat-row">
                <span className="stat-label">Consistency</span>
                <strong className={account.consistencyStatus === 'breach' ? 'red' : account.consistencyStatus === 'warning' ? 'yellow' : 'green'}>
                  {account.topDayPercent.toFixed(1)}% / {account.maxConsistency}%
                </strong>
              </div>

              <div className="consistency-bar">
                <div className="consistency-fill" style={{ width: `${Math.min(100, (account.topDayPercent / account.maxConsistency) * 100)}%` }} />
              </div>
            </div>

            <a href={`/dashboard?account=${account.id}`} className="account-link">
              View Details →
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
