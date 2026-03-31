<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\TradingRule;
use App\Models\TradingAccount;
use Illuminate\Http\Request;

class RuleController extends Controller
{
    /**
     * Get user's trading rules (return rules for each account)
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $rules = TradingRule::where('user_id', $user->id)
            ->with('tradingAccount')
            ->get();

        return response()->json([
            'data' => $rules,
            'message' => 'Trading rules retrieved successfully',
        ]);
    }

    /**
     * Get rule for a specific account
     */
    public function show(Request $request, $accountId)
    {
        $user = $request->user();
        $account = TradingAccount::where('id', $accountId)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $rule = TradingRule::where('user_id', $user->id)
            ->where('trading_account_id', $accountId)
            ->first();

        if (!$rule) {
            // Return default rule if none exists
            $rule = new TradingRule([
                'starting_balance' => 100000,
                'profit_target_percent' => 10,
                'max_daily_loss_percent' => 5,
                'consistency_rule_type' => '40',
                'consistency_threshold_percent' => 40,
            ]);
        }

        return response()->json([
            'data' => $rule,
            'message' => 'Trading rule retrieved successfully',
        ]);
    }

    /**
     * Create or update trading rules for an account
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'trading_account_id' => 'nullable|exists:trading_accounts,id',
            'starting_balance' => 'required|numeric|min:1000',
            'profit_target_percent' => 'required|numeric|min:0.1|max:100',
            'max_daily_loss_percent' => 'required|numeric|min:0.1|max:100',
            'consistency_rule_type' => 'required|in:40,15,custom',
            'consistency_threshold_percent' => 'required|numeric|min:0.1|max:100',
            'max_single_trade_percent' => 'nullable|numeric|min:0.1|max:100',
        ]);

        $validated['user_id'] = $user->id;

        if ($validated['trading_account_id']) {
            // Verify account belongs to user
            TradingAccount::where('id', $validated['trading_account_id'])
                ->where('user_id', $user->id)
                ->firstOrFail();

            // Update or create rule for this account
            $rule = TradingRule::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'trading_account_id' => $validated['trading_account_id'],
                ],
                $validated
            );
        } else {
            // Global rule (applies to all accounts)
            $rule = TradingRule::updateOrCreate(
                ['user_id' => $user->id, 'trading_account_id' => null],
                $validated
            );
        }

        return response()->json([
            'data' => $rule,
            'message' => 'Trading rule saved successfully',
        ], 200);
    }

    /**
     * Update trading rule
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $rule = TradingRule::where('user_id', $user->id)
            ->where('id', $id)
            ->firstOrFail();

        $validated = $request->validate([
            'starting_balance' => 'sometimes|numeric|min:1000',
            'profit_target_percent' => 'sometimes|numeric|min:0.1|max:100',
            'max_daily_loss_percent' => 'sometimes|numeric|min:0.1|max:100',
            'consistency_rule_type' => 'sometimes|in:40,15,custom',
            'consistency_threshold_percent' => 'sometimes|numeric|min:0.1|max:100',
            'max_single_trade_percent' => 'sometimes|numeric|min:0.1|max:100',
        ]);

        $rule->update($validated);

        return response()->json([
            'data' => $rule,
            'message' => 'Trading rule updated successfully',
        ]);
    }

    /**
     * Delete a trading rule
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $rule = TradingRule::where('user_id', $user->id)
            ->where('id', $id)
            ->firstOrFail();

        $rule->delete();

        return response()->json([
            'message' => 'Trading rule deleted successfully',
        ]);
    }
}
