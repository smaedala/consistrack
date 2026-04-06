<?php

namespace App\Services;

use App\Models\TradingAccount;
use App\Models\Trade;
use Illuminate\Support\Collection;

class MetricsService
{
    public function __construct(
        protected ?TradingDayService $tradingDayService = null
    ) {
        $this->tradingDayService = $this->tradingDayService ?: new TradingDayService();
    }

    /**
     * Evaluate account metrics and return an array of computed values.
     */
    public function evaluate(TradingAccount $account): array
    {
        $profitTarget = (float) $account->profit_target;
        $consistencyRulePercent = (float) ($account->consistency_rule_percent ?? 40);
        $dailyDrawdownLimitPercent = (float) ($account->daily_drawdown_limit_percent ?? 5);

        $trades = Trade::where('account_id', $account->id)
            ->orderBy('close_time')
            ->get();

        $dailyTradeGroups = $trades
            ->groupBy(fn(Trade $t) => $this->tradingDayService->tradingDayKeyForTimestamp($account, $t->close_time))
            ->sortKeys();

        $dailyPnL = $dailyTradeGroups
            ->map(fn(Collection $group) => (float) $group->sum(fn(Trade $trade) => (float) $trade->pnl));

        $topDailyProfit = max(0.0, (float) ($dailyPnL->max() ?? 0.0));
        $topDailyPercentOfTarget = $profitTarget > 0 ? ($topDailyProfit / $profitTarget) * 100 : 0.0;

        // max loss percent relative to initial balance
        $initial = (float) $account->initial_balance;
        $totalPnL = (float) $trades->sum(fn(Trade $trade) => (float) $trade->pnl);
        $current = $initial + $totalPnL;
        $maxLossPercent = $initial > 0 ? max(0, (($initial - $current) / $initial) * 100) : 0.0;

        // Daily drawdown by trading-day windows (firm reset-aware).
        $dailyDrawdownPercent = 0.0;
        $runningBalance = $initial;

        foreach ($dailyTradeGroups as $dayTrades) {
            if ($dayTrades->isEmpty()) {
                continue;
            }

            $startingBalance = $runningBalance;
            $cumulative = $startingBalance;
            $peak = $cumulative;
            $maxIntradayDrop = 0.0;
            foreach ($dayTrades as $t) {
                $cumulative += (float) $t->pnl;
                $peak = max($peak, $cumulative);
                $maxIntradayDrop = max($maxIntradayDrop, $peak - $cumulative);
            }

            $runningBalance = $cumulative;

            if ($startingBalance > 0) {
                $dd = ($maxIntradayDrop / $startingBalance) * 100;
                $dailyDrawdownPercent = max($dailyDrawdownPercent, $dd);
            }
        }

        $status = $account->status ?: 'active';
        if ($topDailyPercentOfTarget >= $consistencyRulePercent) {
            $status = 'breached';
        }
        if ($dailyDrawdownPercent >= $dailyDrawdownLimitPercent) {
            $status = 'breached';
        }
        if ($maxLossPercent >= $account->max_loss_limit_percent) {
            $status = 'breached';
        }

        $drawdownRisk = $dailyDrawdownLimitPercent > 0 ? ($dailyDrawdownPercent / $dailyDrawdownLimitPercent) * 100 : 0;
        $consistencyRisk = $consistencyRulePercent > 0 ? ($topDailyPercentOfTarget / $consistencyRulePercent) * 100 : 0;

        return [
            'totalPnL' => $totalPnL,
            'currentBalance' => $current,
            'profitTarget' => $profitTarget,
            'topDailyProfit' => (float) $topDailyProfit,
            'topDailyPercentOfTarget' => round($topDailyPercentOfTarget, 2),
            'dailyDrawdownPercent' => round($dailyDrawdownPercent, 2),
            'maxLossPercent' => round($maxLossPercent, 2),
            'drawdownRiskPercentOfLimit' => round($drawdownRisk, 2),
            'consistencyRiskPercentOfLimit' => round($consistencyRisk, 2),
            'status' => $status,
        ];
    }
}
