<?php

namespace App\Services;

use App\Models\TradingAccount;
use App\Models\Trade;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class MetricsService
{
    /**
     * Evaluate account metrics and return an array of computed values.
     */
    public function evaluate(TradingAccount $account): array
    {
        $profitTarget = (float) $account->profit_target;
        $consistencyRulePercent = (float) ($account->consistency_rule_percent ?? 40);
        $dailyDrawdownLimitPercent = (float) ($account->daily_drawdown_limit_percent ?? 5);

        // Fetch daily sums grouped by date (UTC or account timezone)
        $timezone = $account->timezone ?? 'UTC';

        $daily = Trade::where('account_id', $account->id)
            ->get()
            ->groupBy(function (Trade $t) use ($timezone) {
                return $t->close_time->setTimezone($timezone)->toDateString();
            })
            ->map(fn($group) => collect($group)->sum(fn($t) => (float) $t->pnl))
            ->sortKeys();

        $topDailyProfit = $daily->max() ?? 0.0;
        $topDailyPercentOfTarget = $profitTarget > 0 ? ($topDailyProfit / $profitTarget) * 100 : 0.0;

        // max loss percent relative to initial balance
        $initial = (float) $account->initial_balance;
        $totalPnL = (float) Trade::where('account_id', $account->id)->sum('pnl');
        $current = $initial + $totalPnL;
        $maxLossPercent = $initial > 0 ? max(0, (($initial - $current) / $initial) * 100) : 0.0;

        // Simple daily drawdown: compute per-day peak-trough based on cumulative PnL
        $dailyDrawdownPercent = 0.0;
        foreach ($daily as $date => $pnl) {
            // Reconstruct intraday cumulative series from trades ordered by close_time
            $trades = Trade::where('account_id', $account->id)
                ->whereDate('close_time', $date)
                ->orderBy('close_time')
                ->get();

            if ($trades->isEmpty()) {
                continue;
            }

            $startingBalance = $this->startingBalanceForDay($account, $date);
            $cumulative = $startingBalance;
            $peak = $cumulative;
            $trough = $cumulative;
            foreach ($trades as $t) {
                $cumulative += (float) $t->pnl;
                $peak = max($peak, $cumulative);
                $trough = min($trough, $cumulative);
            }

            if ($startingBalance > 0) {
                $dd = ($peak - $trough) / $startingBalance * 100;
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

    protected function startingBalanceForDay(TradingAccount $account, string $date): float
    {
        // Find last balance before this day (simple approach): initial_balance + sum of pnl before date
        $before = Trade::where('account_id', $account->id)
            ->whereDate('close_time', '<', $date)
            ->sum('pnl');

        return (float) $account->initial_balance + (float) $before;
    }
}
