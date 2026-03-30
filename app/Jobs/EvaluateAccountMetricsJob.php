<?php

namespace App\Jobs;

use App\Models\CachedAccountMetric;
use App\Models\TradingAccount;
use App\Services\MetricsService;
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

    public function handle(MetricsService $metricsService)
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

        // update account status if breached
        if ($metrics['status'] === 'breached' && $account->status !== 'breached') {
            $account->status = 'breached';
            $account->save();
        }
    }
}
