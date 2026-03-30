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
            'initial_balance' => 'required|numeric',
            'profit_target' => 'required|numeric',
            'consistency_rule_percent' => 'integer',
            'timezone' => 'string',
        ]);

        $data['user_id'] = $user->id;

        $account = TradingAccount::create($data);

        return response()->json(['success' => true, 'data' => $account, 'message' => 'Account created'], 201);
    }
}
