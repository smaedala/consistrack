<?php

namespace App\Services;

use App\Models\TradingAccount;
use App\Models\Trade;
use Carbon\Carbon;
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
        $consistencyRuleEnabled = (bool) ($account->consistency_rule_enabled ?? true);
        $dailyDrawdownLimitPercent = (float) ($account->daily_drawdown_limit_percent ?? 5);

        $trades = Trade::where('account_id', $account->id)
            ->orderBy('close_time')
            ->get();

        // Consistency uses calendar 24h day buckets in account timezone.
        $consistencyDayGroups = $trades
            ->groupBy(fn(Trade $t) => $this->calendarDayKeyForTimestamp($account, $t->close_time))
            ->sortKeys();

        // Daily loss uses 24h calendar day buckets in account timezone:
        // profits offset losses for the same day.
        $calendarDayGroups = $trades
            ->groupBy(fn(Trade $t) => $this->calendarDayKeyForTimestamp($account, $t->close_time))
            ->sortKeys();

        $dailyPnL = $consistencyDayGroups
            ->map(fn(Collection $group) => (float) $group->sum(fn(Trade $trade) => (float) $trade->pnl));

        $topDailyProfit = max(0.0, (float) ($dailyPnL->max() ?? 0.0));
        $topDailyPercentOfTarget = $profitTarget > 0 ? ($topDailyProfit / $profitTarget) * 100 : 0.0;

        // max loss percent relative to initial balance
        $initial = (float) $account->initial_balance;
        $totalPnL = (float) $trades->sum(fn(Trade $trade) => (float) $trade->pnl);
        $current = $initial + $totalPnL;
        $maxLossPercent = $initial > 0 ? max(0, (($initial - $current) / $initial) * 100) : 0.0;

        // Live consistency score: Max day profit as % of current total profit.
        $consistencyScorePercent = $totalPnL > 0
            ? (($topDailyProfit / $totalPnL) * 100)
            : 0.0;
        if (!$consistencyRuleEnabled) {
            $consistencyScorePercent = 0.0;
        }

        $tz = $account->timezone ?: ($account->trading_day_reset_timezone ?: 'UTC');
        $todayKey = Carbon::now($tz)->toDateString();
        $todayNetPnl = (float) ($calendarDayGroups->get($todayKey)?->sum(fn(Trade $trade) => (float) $trade->pnl) ?? 0.0);
        $todayNetLoss = max(0.0, -$todayNetPnl);
        $dailyDrawdownPercent = $initial > 0 ? (($todayNetLoss / $initial) * 100) : 0.0;

        $status = $account->status ?: 'active';
        if ($consistencyRuleEnabled && $consistencyScorePercent >= $consistencyRulePercent) {
            $status = 'breached';
        }
        if ($dailyDrawdownPercent >= $dailyDrawdownLimitPercent) {
            $status = 'breached';
        }
        if ($maxLossPercent >= $account->max_loss_limit_percent) {
            $status = 'breached';
        }

        $drawdownRisk = $dailyDrawdownLimitPercent > 0 ? ($dailyDrawdownPercent / $dailyDrawdownLimitPercent) * 100 : 0;
        $consistencyRisk = ($consistencyRuleEnabled && $consistencyRulePercent > 0)
            ? ($consistencyScorePercent / $consistencyRulePercent) * 100
            : 0;

        return [
            'totalPnL' => $totalPnL,
            'currentBalance' => $current,
            'profitTarget' => $profitTarget,
            'topDailyProfit' => (float) $topDailyProfit,
            'topDailyPercentOfTarget' => round($topDailyPercentOfTarget, 2),
            'consistencyScorePercent' => round($consistencyScorePercent, 2),
            'dailyDrawdownPercent' => round($dailyDrawdownPercent, 2),
            'maxLossPercent' => round($maxLossPercent, 2),
            'drawdownRiskPercentOfLimit' => round($drawdownRisk, 2),
            'consistencyRiskPercentOfLimit' => round($consistencyRisk, 2),
            'status' => $status,
        ];
    }

    protected function calendarDayKeyForTimestamp(TradingAccount $account, $timestamp): string
    {
        $tz = $account->timezone ?: ($account->trading_day_reset_timezone ?: 'UTC');
        return Carbon::instance($timestamp)->setTimezone($tz)->toDateString();
    }
}
