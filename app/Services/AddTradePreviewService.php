<?php

namespace App\Services;

use App\Models\Trade;
use App\Models\TradingAccount;
use Carbon\Carbon;
use Carbon\CarbonInterface;

class AddTradePreviewService
{
    public function __construct(
        protected ?TradingDayService $tradingDayService = null
    ) {
        $this->tradingDayService = $this->tradingDayService ?: new TradingDayService();
    }

    public function preview(TradingAccount $account, float $newPnl, ?CarbonInterface $closeTime = null): array
    {
        $closeTime = $closeTime ?: now();
        $limit = (float) ($account->consistency_rule_percent ?? 40);
        $profitTarget = (float) ($account->profit_target ?? 0);
        if ($profitTarget <= 0) {
            $profitTarget = max(1.0, (float) ($account->initial_balance ?? 0) * 0.10);
        }

        $trades = Trade::query()
            ->where('account_id', $account->id)
            ->orderBy('close_time')
            ->get();

        $dailyProfits = [];
        foreach ($trades as $trade) {
            $dayKey = $this->tradingDayService->tradingDayKeyForTimestamp($account, $trade->close_time);
            $dailyProfits[$dayKey] = ($dailyProfits[$dayKey] ?? 0.0) + (float) $trade->pnl;
        }

        $currentMaxDay = !empty($dailyProfits) ? (float) max($dailyProfits) : 0.0;
        $currentTotalProfit = (float) $trades->sum(fn(Trade $trade) => (float) $trade->pnl);

        $projectedTotalProfit = $currentTotalProfit + $newPnl;
        $projectedDayKey = $this->tradingDayService->tradingDayKeyForTimestamp($account, Carbon::instance($closeTime));
        $projectedDayProfit = ($dailyProfits[$projectedDayKey] ?? 0.0) + $newPnl;
        $projectedMaxDay = max($currentMaxDay, $projectedDayProfit);

        // Consistency is measured against profit target, not current total profit.
        $rawProjectedConsistencyPercent = $profitTarget > 0
            ? ($projectedMaxDay / $profitTarget) * 100
            : 0.0;
        $projectedConsistencyPercent = min(100.0, max(0.0, $rawProjectedConsistencyPercent));

        $maxAllowedDayProfit = ($profitTarget * $limit) / 100;
        $remainingBeforeBreach = max(0.0, $maxAllowedDayProfit - $projectedMaxDay);
        $breachOverAmount = max(0.0, $projectedMaxDay - $maxAllowedDayProfit);

        $state = $this->stateForAmounts($projectedMaxDay, $maxAllowedDayProfit, $limit, $profitTarget);
        $message = $this->messageForState(
            $state,
            $newPnl,
            $projectedMaxDay,
            $maxAllowedDayProfit,
            $breachOverAmount,
            $remainingBeforeBreach,
            $limit
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
            'consistency_limit_percent' => round($limit, 2),
            'profit_target_amount' => round($profitTarget, 2),
            'max_allowed_day_profit' => round($maxAllowedDayProfit, 2),
            'remaining_before_breach' => round($remainingBeforeBreach, 2),
            'breach_over_amount' => round($breachOverAmount, 2),
            'equity_impact_amount' => round($newPnl, 2),
            'state' => $state,
            'message' => $message,
        ];
    }

    protected function stateForAmounts(float $projectedMaxDay, float $maxAllowedDayProfit, float $limit, float $profitTarget): string
    {
        if ($projectedMaxDay > $maxAllowedDayProfit) {
            return 'breach';
        }

        $cautionLimitPercent = max(0.0, $limit - 2.0);
        $cautionAmount = ($profitTarget * $cautionLimitPercent) / 100;
        if ($projectedMaxDay >= $cautionAmount) {
            return 'caution';
        }

        return 'safe';
    }

    protected function messageForState(
        string $state,
        float $newPnl,
        float $projectedMaxDay,
        float $maxAllowedDayProfit,
        float $breachOverAmount,
        float $remainingBeforeBreach,
        float $limit
    ): string
    {
        $pnl = number_format($newPnl, 2, '.', ',');
        $lim = number_format($limit, 2, '.', ',');
        $projectedMax = number_format($projectedMaxDay, 2, '.', ',');
        $allowed = number_format($maxAllowedDayProfit, 2, '.', ',');
        $over = number_format($breachOverAmount, 2, '.', ',');
        $remaining = number_format($remainingBeforeBreach, 2, '.', ',');

        if ($state === 'breach') {
            return "Warning: This trade PnL ({$pnl}) sets your max day to {$projectedMax}, above allowed {$allowed} by {$over} (limit {$lim}%).";
        }

        if ($state === 'caution') {
            return "Caution: This trade puts your max day near the allowed limit ({$projectedMax} of {$allowed}). Remaining room: {$remaining}.";
        }

        return "Safe: This trade keeps your max day within allowed {$allowed}. Remaining room: {$remaining}.";
    }
}
