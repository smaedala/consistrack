<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AccountAlert;
use App\Models\TradingAccount;

class AccountAlertController extends Controller
{
    public function index(TradingAccount $account)
    {
        $this->authorize('view', $account);

        $alerts = AccountAlert::where('account_id', $account->id)
            ->orderByDesc('created_at')
            ->limit(100)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $alerts,
            'message' => 'Alerts retrieved',
        ]);
    }
}

