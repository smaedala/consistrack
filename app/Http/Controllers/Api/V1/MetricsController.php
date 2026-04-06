<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CachedAccountMetric;
use App\Models\DailyAccountStat;
use App\Models\TradingAccount;
use App\Services\MetricsService;

class MetricsController extends Controller
{
    public function show(TradingAccount $account, MetricsService $service)
    {
        $this->authorize('view', $account);

        // Fast path: latest daily snapshot
        $dailySnapshot = DailyAccountStat::where('account_id', $account->id)
            ->orderByDesc('trading_day')
            ->first();

        if ($dailySnapshot) {
            return response()->json([
                'success' => true,
                'data' => $dailySnapshot->metrics,
                'message' => 'Daily snapshot metrics',
            ]);
        }

        // Fallback: most recent cached metric
        $cached = CachedAccountMetric::where('account_id', $account->id)->orderByDesc('computed_at')->first();

        if ($cached) {
            return response()->json(['success' => true, 'data' => $cached->metrics, 'message' => 'Cached metrics']);
        }

        // Fallback: compute on demand
        $metrics = $service->evaluate($account);
        return response()->json(['success' => true, 'data' => $metrics, 'message' => 'Metrics calculated']);
    }
}
