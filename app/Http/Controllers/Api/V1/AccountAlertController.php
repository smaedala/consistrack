<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AccountAlert;
use App\Models\TradingAccount;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AccountAlertController extends Controller
{
    public function index(Request $request, TradingAccount $account)
    {
        $this->authorize('view', $account);

        $query = AccountAlert::where('account_id', $account->id);
        if (!$request->boolean('include_snoozed', false)) {
            $query->where(function ($q) {
                $q->whereNull('snoozed_until')->orWhere('snoozed_until', '<=', now());
            });
        }

        $alerts = $query
            ->orderByDesc('created_at')
            ->limit(100)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $alerts,
            'message' => 'Alerts retrieved',
        ]);
    }

    public function acknowledge(Request $request, TradingAccount $account, AccountAlert $alert)
    {
        $this->authorize('update', $account);
        if ($alert->account_id !== $account->id) {
            abort(404);
        }

        $alert->acknowledged_at = now();
        $alert->save();

        return response()->json([
            'success' => true,
            'data' => $alert->fresh(),
            'message' => 'Alert acknowledged',
        ]);
    }

    public function snooze(Request $request, TradingAccount $account, AccountAlert $alert)
    {
        $this->authorize('update', $account);
        if ($alert->account_id !== $account->id) {
            abort(404);
        }

        $validated = $request->validate([
            'minutes' => 'nullable|integer|min:1|max:1440',
            'until' => 'nullable|date',
        ]);

        if (!empty($validated['until'])) {
            $alert->snoozed_until = Carbon::parse($validated['until']);
        } else {
            $minutes = (int) ($validated['minutes'] ?? 60);
            $alert->snoozed_until = now()->addMinutes($minutes);
        }
        $alert->save();

        return response()->json([
            'success' => true,
            'data' => $alert->fresh(),
            'message' => 'Alert snoozed',
        ]);
    }
}
