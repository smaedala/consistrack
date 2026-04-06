<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AccountAlert;
use App\Models\DailyAccountStat;
use App\Models\TradingAccount;
use App\Services\MetricsService;
use App\Services\TradingDayService;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function summary(TradingAccount $account, MetricsService $metricsService)
    {
        $this->authorize('view', $account);

        $snapshot = DailyAccountStat::where('account_id', $account->id)
            ->orderByDesc('trading_day')
            ->first();

        $metrics = $snapshot?->metrics ?? $metricsService->evaluate($account);
        $riskStatus = $this->buildRiskStatus($account);

        return response()->json([
            'success' => true,
            'data' => [
                'account' => [
                    'id' => $account->id,
                    'name' => $account->account_name,
                    'status' => $account->status,
                ],
                'metrics' => $metrics,
                'risk_status' => $riskStatus,
            ],
            'message' => 'Dashboard summary',
        ]);
    }

    public function equityCurve(Request $request, TradingAccount $account, TradingDayService $tradingDayService)
    {
        $this->authorize('view', $account);

        $days = min(365, max(7, (int) $request->integer('days', 30)));
        $trades = $account->trades()->orderBy('close_time')->get();

        $grouped = $trades->groupBy(
            fn($trade) => $tradingDayService->tradingDayKeyForTimestamp($account, $trade->close_time)
        );

        $allKeys = $grouped->keys()->sort()->values();
        $keys = $allKeys->slice(max(0, $allKeys->count() - $days));

        $equity = (float) $account->initial_balance;
        $runningByDay = [];
        foreach ($allKeys as $key) {
            $equity += (float) $grouped[$key]->sum('pnl');
            $runningByDay[$key] = $equity;
        }

        $series = $keys->map(function (string $dayKey) use ($grouped, $runningByDay) {
            $dayTrades = $grouped[$dayKey];
            return [
                'day' => $dayKey,
                'equity' => round((float) ($runningByDay[$dayKey] ?? 0), 2),
                'pnl' => round((float) $dayTrades->sum('pnl'), 2),
                'trades' => $dayTrades->count(),
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => [
                'days' => $days,
                'series' => $series,
            ],
            'message' => 'Equity curve',
        ]);
    }

    public function recentTrades(Request $request, TradingAccount $account)
    {
        $this->authorize('view', $account);

        $validated = $request->validate([
            'symbol' => 'nullable|string|max:20',
            'type' => 'nullable|in:buy,sell',
            'q' => 'nullable|string|max:50',
            'pnl' => 'nullable|in:positive,negative',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $query = $account->trades()->orderByDesc('close_time');

        if (!empty($validated['symbol'])) {
            $query->where('symbol', 'like', '%' . strtoupper($validated['symbol']) . '%');
        }
        if (!empty($validated['type'])) {
            $query->where('type', $validated['type']);
        }
        if (!empty($validated['q'])) {
            $q = $validated['q'];
            $query->where(function ($inner) use ($q) {
                $inner->where('symbol', 'like', "%{$q}%")
                    ->orWhere('strategy_tag', 'like', "%{$q}%")
                    ->orWhere('external_id', 'like', "%{$q}%");
            });
        }
        if (($validated['pnl'] ?? null) === 'positive') {
            $query->where('pnl', '>=', 0);
        }
        if (($validated['pnl'] ?? null) === 'negative') {
            $query->where('pnl', '<', 0);
        }

        $perPage = (int) ($validated['per_page'] ?? 8);
        $trades = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $trades,
            'message' => 'Recent trades',
        ]);
    }

    public function performanceBySymbol(TradingAccount $account)
    {
        $this->authorize('view', $account);

        $trades = $account->trades()->get()->groupBy('symbol');

        $rows = $trades->map(function ($group, $symbol) {
            $wins = $group->filter(fn($t) => (float) $t->pnl > 0);
            $losses = $group->filter(fn($t) => (float) $t->pnl < 0);
            $count = $group->count();

            return [
                'symbol' => $symbol,
                'trades' => $count,
                'win_rate' => $count > 0 ? round(($wins->count() / $count) * 100, 2) : 0.0,
                'pnl' => round((float) $group->sum('pnl'), 2),
                'avg_win' => $wins->count() > 0 ? round((float) $wins->avg('pnl'), 2) : 0.0,
                'avg_loss' => $losses->count() > 0 ? round((float) $losses->avg('pnl'), 2) : 0.0,
            ];
        })->sortByDesc('pnl')->values();

        return response()->json([
            'success' => true,
            'data' => $rows,
            'message' => 'Performance by symbol',
        ]);
    }

    public function winLossDistribution(Request $request, TradingAccount $account, TradingDayService $tradingDayService)
    {
        $this->authorize('view', $account);

        $days = min(60, max(5, (int) $request->integer('days', 5)));
        $trades = $account->trades()->orderBy('close_time')->get();

        $grouped = $trades
            ->groupBy(fn($trade) => $tradingDayService->tradingDayKeyForTimestamp($account, $trade->close_time))
            ->sortKeys();

        $keys = $grouped->keys()->slice(max(0, $grouped->count() - $days));
        $series = $keys->map(function (string $dayKey) use ($grouped) {
            $dayTrades = $grouped[$dayKey];
            return [
                'day' => $dayKey,
                'wins' => $dayTrades->where('pnl', '>', 0)->count(),
                'losses' => $dayTrades->where('pnl', '<', 0)->count(),
                'pnl' => round((float) $dayTrades->sum('pnl'), 2),
            ];
        })->values();

        $totalWins = (int) $series->sum('wins');
        $totalLosses = (int) $series->sum('losses');
        $total = max(1, $totalWins + $totalLosses);

        return response()->json([
            'success' => true,
            'data' => [
                'days' => $days,
                'series' => $series,
                'totals' => [
                    'wins' => $totalWins,
                    'losses' => $totalLosses,
                    'win_rate' => round(($totalWins / $total) * 100, 2),
                ],
            ],
            'message' => 'Win/loss distribution',
        ]);
    }

    protected function buildRiskStatus(TradingAccount $account): array
    {
        $latestByType = AccountAlert::where('account_id', $account->id)
            ->orderByDesc('created_at')
            ->get()
            ->groupBy('alert_type')
            ->map(fn($group) => $group->first())
            ->values();

        $overall = 'info';
        if ($latestByType->contains(fn($a) => $a->level === 'critical')) {
            $overall = 'critical';
        } elseif ($latestByType->contains(fn($a) => $a->level === 'warning')) {
            $overall = 'warning';
        }

        return [
            'overall_level' => $overall,
            'by_type' => $latestByType->map(function (AccountAlert $alert) {
                return [
                    'type' => $alert->alert_type,
                    'level' => $alert->level,
                    'payload' => $alert->payload,
                    'created_at' => optional($alert->created_at)?->toISOString(),
                ];
            })->values(),
        ];
    }
}
