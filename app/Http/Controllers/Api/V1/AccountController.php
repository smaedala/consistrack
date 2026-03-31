<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\TradingAccount;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        return response()->json(['success' => true, 'data' => TradingAccount::where('user_id', $user->id)->get(), 'message' => 'Accounts retrieved']);
    }

    public function show(TradingAccount $account)
    {
        $this->authorize('view', $account);
        return response()->json(['success' => true, 'data' => $account, 'message' => 'Account retrieved']);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'account_name' => 'required|string',
            'initial_balance' => 'required|numeric|min:0',
            'current_balance' => 'nullable|numeric|min:0',
            'profit_target' => 'required|numeric|min:0',
            'consistency_rule_percent' => 'nullable|integer|min:1|max:100',
            'daily_drawdown_limit_percent' => 'nullable|integer|min:1|max:100',
            'max_loss_limit_percent' => 'nullable|integer|min:1|max:100',
            'timezone' => 'nullable|string',
            'status' => 'nullable|in:active,passed,breached',
        ]);

        $data['user_id'] = $user->id;
        $data['current_balance'] = $data['current_balance'] ?? $data['initial_balance'];

        $account = TradingAccount::create($data);

        return response()->json(['success' => true, 'data' => $account, 'message' => 'Account created'], 201);
    }

    public function update(Request $request, TradingAccount $account)
    {
        $this->authorize('update', $account);

        $data = $request->validate([
            'account_name' => 'sometimes|string',
            'initial_balance' => 'sometimes|numeric|min:0',
            'current_balance' => 'sometimes|numeric|min:0',
            'profit_target' => 'sometimes|numeric|min:0',
            'consistency_rule_percent' => 'sometimes|integer|min:1|max:100',
            'daily_drawdown_limit_percent' => 'sometimes|integer|min:1|max:100',
            'max_loss_limit_percent' => 'sometimes|integer|min:1|max:100',
            'timezone' => 'sometimes|string',
            'status' => 'sometimes|in:active,passed,breached',
        ]);

        $account->update($data);

        return response()->json(['success' => true, 'data' => $account->fresh(), 'message' => 'Account updated']);
    }
}
