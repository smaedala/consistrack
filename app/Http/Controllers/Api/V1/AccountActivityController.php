<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AccountActivityLog;
use App\Models\TradingAccount;
use Illuminate\Http\Request;

class AccountActivityController extends Controller
{
    public function index(Request $request, TradingAccount $account)
    {
        $this->authorize('view', $account);

        $perPage = min(50, max(5, (int) $request->integer('per_page', 12)));
        $logs = AccountActivityLog::where('account_id', $account->id)
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $logs,
            'message' => 'Activity logs retrieved',
        ]);
    }
}

