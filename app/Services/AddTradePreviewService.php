<?php

namespace App\Services;

use App\Models\Trade;
use App\Models\TradingAccount;
use Carbon\Carbon;
use Carbon\CarbonInterface;

class AddTradePreviewService
{
    public function preview(TradingAccount $account, float $newPnl, ?CarbonInterface $closeTime = null): array
    {
        $closeTime = $closeTime ?: now();
        $consistencyRuleEnabled = (bool) ($account->consistency_rule_enabled ?? true);
        $limit = (float) ($account->consistency_rule_percent ?? 40);
        $trades = Trade::query()
            ->where('account_id', $account->id)
            ->orderBy('close_time')
            ->get();

        $dailyProfits = [];
        foreach ($trades as $trade) {
            $dayKey = $this->calendarDayKeyForTimestamp($account, $trade->close_time);
            $dailyProfits[$dayKey] = ($dailyProfits[$dayKey] ?? 0.0) + (float) $trade->pnl;
        }

        $currentMaxDay = !empty($dailyProfits) ? (float) max($dailyProfits) : 0.0;
        $currentTotalProfit = (float) $trades->sum(fn(Trade $trade) => (float) $trade->pnl);

        $projectedTotalProfit = $currentTotalProfit + $newPnl;
        $projectedDayKey = $this->calendarDayKeyForTimestamp($account, Carbon::instance($closeTime));
        $projectedDayProfit = ($dailyProfits[$projectedDayKey] ?? 0.0) + $newPnl;
        $projectedMaxDay = max($currentMaxDay, $projectedDayProfit);

        // Live consistency score is Max Day / Total Profit.
        $rawProjectedConsistencyPercent = $projectedTotalProfit > 0
            ? ($projectedMaxDay / $projectedTotalProfit) * 100
            : 0.0;
        $projectedConsistencyPercent = max(0.0, $rawProjectedConsistencyPercent);

        $maxAllowedDayProfit = $projectedTotalProfit > 0
            ? ($projectedTotalProfit * $limit) / 100
            : 0.0;
        $remainingBeforeBreach = max(0.0, $maxAllowedDayProfit - $projectedMaxDay);
        $breachOverAmount = max(0.0, $projectedMaxDay - $maxAllowedDayProfit);

        $state = $consistencyRuleEnabled
            ? $this->stateForAmounts($projectedConsistencyPercent, $limit, $projectedTotalProfit)
            : 'safe';
        $message = $this->messageForState(
            $state,
            $newPnl,
            $projectedConsistencyPercent,
            $maxAllowedDayProfit,
            $breachOverAmount,
            $remainingBeforeBreach,
            $limit,
            $projectedMaxDay,
            $projectedTotalProfit,
            $consistencyRuleEnabled
        );

        return [
            'current_max_day_profit' => round($currentMaxDay, 2),
            'current_total_profit' => round($currentTotalProfit, 2),
            'new_trade_pnl' => round($newPnl, 2),
            'projected_day_profit' => round($projectedDayProfit, 2),
            'projected_max_day_profit' => round($projectedMaxDay, 2),
            'projected_total_profit' => round($projectedTotalProfit, 2),
            'raw_projected_consistency_percent' => round($rawProjectedConsistencyPercent, 2),
            'projected_consistency_percent' => round($projectedConsistencyPercent, 2),
            'consistency_limit_percent' => $consistencyRuleEnabled ? round($limit, 2) : 0.0,
            'max_allowed_day_profit' => round($maxAllowedDayProfit, 2),
            'remaining_before_breach' => round($remainingBeforeBreach, 2),
            'breach_over_amount' => round($breachOverAmount, 2),
            'equity_impact_amount' => round($newPnl, 2),
            'state' => $state,
            'message' => $message,
        ];
    }

    protected function stateForAmounts(float $projectedConsistencyPercent, float $limit, float $projectedTotalProfit): string
    {
        if ($projectedTotalProfit <= 0) {
            return 'safe';
        }

        if ($projectedConsistencyPercent > $limit) {
            return 'breach';
        }

        $cautionLimitPercent = max(0.0, $limit - 2.0);
        if ($projectedConsistencyPercent >= $cautionLimitPercent) {
            return 'caution';
        }

        return 'safe';
    }

    protected function messageForState(
        string $state,
        float $newPnl,
        float $projectedConsistencyPercent,
        float $maxAllowedDayProfit,
        float $breachOverAmount,
        float $remainingBeforeBreach,
        float $limit,
        float $projectedMaxDay,
        float $projectedTotalProfit,
        bool $consistencyRuleEnabled = true
    ): string
    {
        $pnl = number_format($newPnl, 2, '.', ',');
        $lim = number_format($limit, 2, '.', ',');
        $projectedScore = number_format($projectedConsistencyPercent, 2, '.', ',');
        $projectedMax = number_format($projectedMaxDay, 2, '.', ',');
        $projectedTotal = number_format($projectedTotalProfit, 2, '.', ',');
        $allowed = number_format($maxAllowedDayProfit, 2, '.', ',');
        $over = number_format($breachOverAmount, 2, '.', ',');
        $remaining = number_format($remainingBeforeBreach, 2, '.', ',');

        if (!$consistencyRuleEnabled) {
            return "Consistency rule is disabled for this account. Trade PnL ({$pnl}) will update balance and daily-loss metrics only.";
        }

        if ($projectedTotalProfit <= 0) {
            return "Info: Total profit is {$projectedTotal}. Consistency score activates when total profit is above 0.";
        }

        if ($state === 'breach') {
            return "Warning: This trade PnL ({$pnl}) sets 24h consistency to {$projectedScore}% (limit {$lim}%). Highest 24h day {$projectedMax} exceeds allowed {$allowed} by {$over}.";
        }

        if ($state === 'caution') {
            return "Caution: 24h consistency becomes {$projectedScore}% (near {$lim}% limit). Highest 24h day {$projectedMax} of allowed {$allowed}. Remaining room: {$remaining}.";
        }

        return "Safe: 24h consistency becomes {$projectedScore}%. Highest 24h day {$projectedMax} within allowed {$allowed}. Remaining room: {$remaining}.";
    }

    protected function calendarDayKeyForTimestamp(TradingAccount $account, CarbonInterface $timestamp): string
    {
        $tz = $account->timezone ?: ($account->trading_day_reset_timezone ?: 'UTC');
        return Carbon::instance($timestamp)->setTimezone($tz)->toDateString();
    }
}
