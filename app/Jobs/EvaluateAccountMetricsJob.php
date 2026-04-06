<?php

namespace App\Jobs;

use App\Models\AccountAlert;
use App\Models\CachedAccountMetric;
use App\Models\DailyAccountStat;
use App\Models\TradingAccount;
use App\Services\MetricsService;
use App\Services\TradingDayService;
use Illuminate\Support\Facades\DB;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class EvaluateAccountMetricsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $accountId;

    public function __construct(int $accountId)
    {
        $this->accountId = $accountId;
    }

    public function handle(MetricsService $metricsService, TradingDayService $tradingDayService)
    {
        $account = TradingAccount::find($this->accountId);
        if (! $account) {
            return;
        }

        $metrics = $metricsService->evaluate($account);

        // persist cached metrics
        CachedAccountMetric::create([
            'account_id' => $account->id,
            'metrics' => $metrics,
            'computed_at' => now(),
        ]);

        $tradingDay = $tradingDayService->tradingDayKeyNow($account);
        DB::table('daily_account_stats')->upsert(
            [[
                'account_id' => $account->id,
                'trading_day' => $tradingDay,
                'metrics' => json_encode($metrics),
                'computed_at' => now(),
                'updated_at' => now(),
                'created_at' => now(),
            ]],
            ['account_id', 'trading_day'],
            ['metrics', 'computed_at', 'updated_at']
        );

        // update account status if breached
        $account->current_balance = $metrics['currentBalance'] ?? $account->current_balance;
        if (($metrics['status'] ?? null) === 'breached' && $account->status !== 'breached') {
            $account->status = 'breached';
        }
        $account->save();

        $this->storeRiskAlerts($account, $metrics);
    }

    protected function storeRiskAlerts(TradingAccount $account, array $metrics): void
    {
        $drawdownRisk = (float) ($metrics['drawdownRiskPercentOfLimit'] ?? 0);
        $consistencyRisk = (float) ($metrics['consistencyRiskPercentOfLimit'] ?? 0);
        $maxLossPercent = (float) ($metrics['maxLossPercent'] ?? 0);
        $maxLossLimit = (float) ($account->max_loss_limit_percent ?? 10);

        $this->upsertRecentAlert($account->id, 'drawdown', $drawdownRisk >= 100 ? 'critical' : ($drawdownRisk >= 70 ? 'warning' : 'info'), [
            'risk_percent_of_limit' => $drawdownRisk,
            'daily_drawdown_percent' => $metrics['dailyDrawdownPercent'] ?? 0,
            'limit_percent' => $account->daily_drawdown_limit_percent,
        ]);

        $this->upsertRecentAlert($account->id, 'consistency', $consistencyRisk >= 100 ? 'critical' : ($consistencyRisk >= 70 ? 'warning' : 'info'), [
            'risk_percent_of_limit' => $consistencyRisk,
            'top_daily_percent_of_target' => $metrics['topDailyPercentOfTarget'] ?? 0,
            'limit_percent' => $account->consistency_rule_percent,
        ]);

        $maxLossRisk = $maxLossLimit > 0 ? (($maxLossPercent / $maxLossLimit) * 100) : 0;
        $this->upsertRecentAlert($account->id, 'max_loss', $maxLossRisk >= 100 ? 'critical' : ($maxLossRisk >= 70 ? 'warning' : 'info'), [
            'risk_percent_of_limit' => round($maxLossRisk, 2),
            'max_loss_percent' => $maxLossPercent,
            'limit_percent' => $maxLossLimit,
        ]);
    }

    protected function upsertRecentAlert(int $accountId, string $type, string $level, array $payload): void
    {
        $latest = AccountAlert::where('account_id', $accountId)
            ->where('alert_type', $type)
            ->orderByDesc('created_at')
            ->first();

        if ($latest && $latest->level === $level) {
            $latest->update(['payload' => $payload]);
            return;
        }

        AccountAlert::create([
            'account_id' => $accountId,
            'alert_type' => $type,
            'level' => $level,
            'payload' => $payload,
        ]);
    }
}
