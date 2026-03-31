/**
 * Real-Time Consistency Validator Service
 * Calculates breach risk and safety warnings for trading rules
 */

export function calculateConsistencyStatus(trades, rules, currentMetrics) {
  if (!rules || !trades || !currentMetrics) {
    return {
      isAtRisk: false,
      breachType: null,
      message: 'No data available',
    }
  }

  const totalProfit = currentMetrics.currentBalance - rules.starting_balance
  const maxConsistencyAmount = (totalProfit * rules.consistency_threshold_percent) / 100

  // Find highest daily profit
  let highestDaily = 0
  trades.forEach((trade) => {
    const pnl = Number(trade.pnl || 0)
    if (pnl > highestDaily) {
      highestDaily = pnl
    }
  })

  const consistencyPercent = (highestDaily / Math.max(totalProfit, 1)) * 100
  const breachThreshold = rules.consistency_threshold_percent

  return {
    highestDaily,
    totalProfit,
    maxConsistencyAmount,
    consistencyPercent,
    breachThreshold,
    isAtRisk: consistencyPercent > breachThreshold * 0.8, // Warning at 80% of threshold
    isBreach: consistencyPercent > breachThreshold,
    percentageOfThreshold: (consistencyPercent / breachThreshold) * 100,
    breachType: consistencyPercent > breachThreshold ? 'CONSISTENCY_BREACH' : null,
  }
}

export function calculateTradeImpact(newTrade, dailyPnL, rules, currentMetrics) {
  /**
   * Calculates what happens if a trade closes now
   * Shows if closing will breach consistency rule
   */
  const tradeAmount = Number(newTrade.pnl || 0)
  const newDailyPnL = dailyPnL + tradeAmount

  const totalProfit = currentMetrics.currentBalance - rules.starting_balance + tradeAmount
  const maxConsistencyAmount = (totalProfit * rules.consistency_threshold_percent) / 100

  const newConsistencyPercent = (newDailyPnL / Math.max(totalProfit, 1)) * 100
  const willBreach = newConsistencyPercent > rules.consistency_threshold_percent

  return {
    tradeAmount,
    newDailyPnL,
    newTotalProfit: totalProfit,
    newConsistencyPercent,
    maxConsistencyAmount,
    willBreach,
    message: willBreach
      ? `⚠️ ALERT: Closing this trade will reach ${newConsistencyPercent.toFixed(1)}% of your ${rules.consistency_threshold_percent}% limit!`
      : `✓ Safe to close. New consistency: ${newConsistencyPercent.toFixed(1)}%`,
  }
}

export function calculateDailyLossRemaining(dailyLoss, rules) {
  /**
   * Calculates remaining daily loss buffer
   */
  const maxDailyLoss = (rules.starting_balance * rules.max_daily_loss_percent) / 100
  const remaining = maxDailyLoss - dailyLoss
  const percentageUsed = (dailyLoss / maxDailyLoss) * 100

  return {
    maxDailyLoss,
    dailyLoss,
    remaining: Math.max(0, remaining),
    percentageUsed: Math.min(100, percentageUsed),
    isNearLimit: percentageUsed > 80,
    isAtLimit: percentageUsed >= 100,
    warningLevel: percentageUsed > 90 ? 'critical' : percentageUsed > 75 ? 'warning' : 'safe',
  }
}

export function calculateProfitProgress(currentBalance, rules) {
  /**
   * Calculates progress toward profit target
   */
  const profitTarget = (rules.starting_balance * rules.profit_target_percent) / 100
  const currentProfit = currentBalance - rules.starting_balance
  const progress = (currentProfit / Math.max(profitTarget, 1)) * 100

  return {
    profitTarget,
    currentProfit,
    progress: Math.min(100, Math.max(0, progress)),
    isTargetMet: currentProfit >= profitTarget,
  }
}

export function calculateSafeToCloseIndicator(tradeRunner, rules, dailyPnL, totalProfit) {
  /**
   * Determines if a runner trade is safe to close
   * Used as a real-time "should I close this?" indicator
   */
  if (!tradeRunner) return null

  const runnerPnL = Number(tradeRunner.pnl || 0)
  const projectedDailyPnL = dailyPnL + runnerPnL
  const projectedTotalProfit = totalProfit + runnerPnL
  const projectedConsistencyPercent = (projectedDailyPnL / Math.max(projectedTotalProfit, 1)) * 100

  const willBreach = projectedConsistencyPercent > rules.consistency_threshold_percent

  return {
    tradeId: tradeRunner.id,
    runnerPnL,
    projectedDailyPnL,
    projectedConsistencyPercent,
    willBreach,
    riskLevel: willBreach ? 'high' : projectedConsistencyPercent > rules.consistency_threshold_percent * 0.8 ? 'warning' : 'safe',
    recommendation: willBreach
      ? `❌ DO NOT CLOSE: Would breach consistency (${projectedConsistencyPercent.toFixed(1)}% > ${rules.consistency_threshold_percent}%)`
      : `✓ SAFE: Can close. Consistency will be ${projectedConsistencyPercent.toFixed(1)}%`,
  }
}

export function validateAgainstRules(trade, dailyStats, rules, account) {
  /**
   * Comprehensive validation of a trade against all rules
   */
  const violations = []

  // Check max single trade size if rule exists
  if (rules.max_single_trade_percent) {
    const maxTradeSize = (rules.starting_balance * rules.max_single_trade_percent) / 100
    const tradeSize = Math.abs(Number(trade.pnl || 0))
    if (tradeSize > maxTradeSize) {
      violations.push({
        type: 'MAX_SINGLE_TRADE',
        message: `Trade size €${tradeSize} exceeds max single trade limit €${maxTradeSize}`,
      })
    }
  }

  // Check daily loss limit
  const maxDailyLoss = (rules.starting_balance * rules.max_daily_loss_percent) / 100
  if (dailyStats.totalLoss + Math.abs(Number(trade.pnl || 0)) > maxDailyLoss) {
    violations.push({
      type: 'DAILY_LOSS_EXCEEDED',
      message: `Would exceed daily loss limit of €${maxDailyLoss}`,
    })
  }

  return {
    isValid: violations.length === 0,
    violations,
  }
}
