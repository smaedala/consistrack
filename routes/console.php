<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Jobs\EvaluateAccountMetricsJob;
use App\Models\TradingAccount;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('metrics:reconcile-accounts {--status=active} {--chunk=100}', function () {
    $status = (string) $this->option('status');
    $chunk = max(10, (int) $this->option('chunk'));

    $query = TradingAccount::query();
    if ($status !== 'all') {
        $query->where('status', $status);
    }

    $count = 0;
    $query->orderBy('id')->chunkById($chunk, function ($accounts) use (&$count) {
        foreach ($accounts as $account) {
            EvaluateAccountMetricsJob::dispatchSync($account->id);
            $count++;
        }
    });

    $this->info("Metrics reconciliation completed. Accounts processed: {$count}");
})->purpose('Rebuild cached metrics + daily snapshots for trading accounts');

Schedule::command('metrics:reconcile-accounts --status=active')
    ->hourly()
    ->withoutOverlapping()
    ->onOneServer();
