<?php

namespace App\Listeners;

use App\Events\TradeCreated;
use App\Jobs\EvaluateAccountMetricsJob;

class DispatchEvaluateAccountMetrics
{
    /**
     * Handle the event.
     */
    public function handle(TradeCreated $event): void
    {
        $accountId = $event->trade->account_id;
        // Keep dashboard/live cards in sync immediately after manual trade add.
        EvaluateAccountMetricsJob::dispatchSync($accountId);
    }
}
