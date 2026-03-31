import React, { useMemo } from 'react'

export default function DailyLossAlert({ dailyLoss, maxDailyLoss, trades }) {
  const { remaining, percentageUsed, warningLevel } = useMemo(() => {
    const max = maxDailyLoss || 5000
    const current = Math.abs(dailyLoss || 0)
    const pct = (current / max) * 100

    return {
      remaining: Math.max(0, max - current),
      percentageUsed: Math.min(100, pct),
      warningLevel: pct >= 100 ? 'critical' : pct > 80 ? 'warning' : 'safe',
    }
  }, [dailyLoss, maxDailyLoss])

  const shouldPulse = warningLevel !== 'safe'
  const isBlocked = warningLevel === 'critical'

  return (
    <div className={`daily-loss-alert daily-loss-${warningLevel} ${shouldPulse ? 'pulsing' : ''}`}>
      <div className="daily-loss-content">
        <div className="daily-loss-icon">
          {warningLevel === 'critical' ? '🛑' : warningLevel === 'warning' ? '⚠️' : '✓'}
        </div>

        <div className="daily-loss-info">
          <h3>Daily Loss Buffer</h3>
          <div className="daily-loss-amount">
            €{remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="daily-loss-unit">remaining</span>
          </div>
        </div>

        <div className="daily-loss-bar">
          <div className="daily-loss-fill" style={{ width: `${percentageUsed}%` }} />
        </div>

        <div className="daily-loss-status">
          {warningLevel === 'critical' && (
            <p className="daily-loss-message critical">
              🛑 HARD STOP REACHED - TRADING DISABLED
            </p>
          )}
          {warningLevel === 'warning' && (
            <p className="daily-loss-message warning">
              ⚠️ CAUTION: Within 1% of daily loss limit
            </p>
          )}
          {warningLevel === 'safe' && (
            <p className="daily-loss-message safe">
              ✓ Daily loss limit: {percentageUsed.toFixed(1)}% used
            </p>
          )}
        </div>
      </div>

      {isBlocked && (
        <div className="daily-loss-blocked">
          <div className="daily-loss-overlay" />
          <div className="daily-loss-blocked-message">
            <strong>TRADING BLOCKED</strong>
            <p>You have reached your daily loss limit</p>
            <p>Close this position or wait until tomorrow</p>
          </div>
        </div>
      )}
    </div>
  )
}
