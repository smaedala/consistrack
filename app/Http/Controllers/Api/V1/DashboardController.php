<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AccountAlert;
use App\Models\DailyAccountStat;
use App\Models\TradingAccount;
use App\Services\MetricsService;
use App\Services\TradingDayService;
use Carbon\Carbon;
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
            'strategy_tag' => 'nullable|string|max:120',
            'type' => 'nullable|in:buy,sell',
            'q' => 'nullable|string|max:50',
            'pnl' => 'nullable|in:positive,negative',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'sort' => 'nullable|in:close_time_desc,close_time_asc,pnl_desc,pnl_asc',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $query = $account->trades();

        $sort = $validated['sort'] ?? 'close_time_desc';
        match ($sort) {
            'close_time_asc' => $query->orderBy('close_time'),
            'pnl_desc' => $query->orderByDesc('pnl')->orderByDesc('close_time'),
            'pnl_asc' => $query->orderBy('pnl')->orderByDesc('close_time'),
            default => $query->orderByDesc('close_time'),
        };

        if (!empty($validated['symbol'])) {
            $query->where('symbol', 'like', '%' . strtoupper($validated['symbol']) . '%');
        }
        if (!empty($validated['type'])) {
            $query->where('type', $validated['type']);
        }
        if (!empty($validated['strategy_tag'])) {
            $query->where('strategy_tag', 'like', '%' . $validated['strategy_tag'] . '%');
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
        if (!empty($validated['date_from'])) {
            $query->where('close_time', '>=', Carbon::parse($validated['date_from'])->startOfDay());
        }
        if (!empty($validated['date_to'])) {
            $query->where('close_time', '<=', Carbon::parse($validated['date_to'])->endOfDay());
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

    public function tradingActivityCalendar(Request $request, TradingAccount $account)
    {
        $this->authorize('view', $account);

        $validated = $request->validate([
            'month' => ['nullable', 'regex:/^\d{4}-\d{2}$/'],
        ]);

        // Calendar view should be true 24-hour day buckets (00:00 -> 23:59) in account timezone.
        $tz = $account->timezone ?: ($account->trading_day_reset_timezone ?: 'UTC');
        $monthInput = $validated['month'] ?? Carbon::now($tz)->format('Y-m');

        $monthStartLocal = Carbon::createFromFormat('Y-m-d H:i', "{$monthInput}-01 00:00", $tz)->startOfDay();
        $monthEndLocal = $monthStartLocal->copy()->endOfMonth()->endOfDay();
        $gridStartLocal = $monthStartLocal->copy()->startOfWeek(Carbon::MONDAY)->startOfDay();
        $gridEndLocal = $monthEndLocal->copy()->endOfWeek(Carbon::SUNDAY)->endOfDay();

        $windowStartUtc = $gridStartLocal->copy()->utc();
        $windowEndExclusiveUtc = $gridEndLocal->copy()->addDay()->startOfDay()->utc();

        $trades = $account->trades()
            ->where('close_time', '>=', $windowStartUtc)
            ->where('close_time', '<', $windowEndExclusiveUtc)
            ->get();

        $grouped = $trades->groupBy(
            fn($trade) => Carbon::instance($trade->close_time)->setTimezone($tz)->toDateString()
        );

        $days = [];
        $cursor = $gridStartLocal->copy();
        while ($cursor->lte($gridEndLocal)) {
            $key = $cursor->toDateString();
            $dayTrades = $grouped->get($key, collect());
            $pnl = round((float) $dayTrades->sum('pnl'), 2);
            $tradesCount = $dayTrades->count();

            $status = 'no_trades';
            if ($tradesCount > 0) {
                $status = $pnl >= 0 ? 'profit' : 'loss';
            }

            $days[] = [
                'date' => $key,
                'day' => (int) $cursor->format('j'),
                'in_current_month' => $cursor->month === $monthStartLocal->month,
                'trades' => $tradesCount,
                'pnl' => $pnl,
                'status' => $status,
            ];

            $cursor->addDay();
        }

        $currentMonthDays = collect($days)->where('in_current_month', true)->values();

        return response()->json([
            'success' => true,
            'data' => [
                'month' => $monthStartLocal->format('Y-m'),
                'month_label' => $monthStartLocal->format('F Y'),
                'week_days' => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                'days' => $days,
                'summary' => [
                    'total_trades' => (int) $currentMonthDays->sum('trades'),
                    'total_pnl' => round((float) $currentMonthDays->sum('pnl'), 2),
                    'profitable_days' => $currentMonthDays->where('status', 'profit')->count(),
                    'losing_days' => $currentMonthDays->where('status', 'loss')->count(),
                    'no_trade_days' => $currentMonthDays->where('status', 'no_trades')->count(),
                ],
            ],
            'message' => 'Trading activity calendar',
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
