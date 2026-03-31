<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\TradingAccount;
use App\Models\CachedAccountMetric;
use App\Services\MetricsService;

class MetricsController extends Controller
{
    public function show(TradingAccount $account, MetricsService $service)
    {
        $this->authorize('view', $account);

        // Try to return the most recent cached metric
        $cached = CachedAccountMetric::where('account_id', $account->id)->orderByDesc('computed_at')->first();

        if ($cached) {
            return response()->json(['success' => true, 'data' => $cached->metrics, 'message' => 'Cached metrics']);
        }

        // Fallback: compute on demand
        $metrics = $service->evaluate($account);
        return response()->json(['success' => true, 'data' => $metrics, 'message' => 'Metrics calculated']);
    }
}
