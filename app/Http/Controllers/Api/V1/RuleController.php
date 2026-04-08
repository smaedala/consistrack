<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Jobs\EvaluateAccountMetricsJob;
use App\Models\TradingRule;
use App\Models\TradingAccount;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

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
            'success' => true,
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
            'success' => true,
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
        $this->enforceRuleGuardrails($validated);

        if ($validated['trading_account_id']) {
            // Verify account belongs to user
            $account = TradingAccount::where('id', $validated['trading_account_id'])
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

            $this->applyRuleToAccount($rule, $account);
        } else {
            // Global rule (applies to all accounts)
            $rule = TradingRule::updateOrCreate(
                ['user_id' => $user->id, 'trading_account_id' => null],
                $validated
            );

            TradingAccount::where('user_id', $user->id)
                ->get()
                ->each(function (TradingAccount $account) use ($rule): void {
                    $this->applyRuleToAccount($rule, $account);
                });
        }

        return response()->json([
            'success' => true,
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

        $candidate = array_merge($rule->toArray(), $validated);
        $this->enforceRuleGuardrails($candidate);

        $rule->update($validated);

        if ($rule->trading_account_id) {
            $account = TradingAccount::where('id', $rule->trading_account_id)
                ->where('user_id', $user->id)
                ->first();

            if ($account) {
                $this->applyRuleToAccount($rule, $account);
            }
        } else {
            TradingAccount::where('user_id', $user->id)
                ->get()
                ->each(function (TradingAccount $account) use ($rule): void {
                    $this->applyRuleToAccount($rule, $account);
                });
        }

        return response()->json([
            'success' => true,
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

        if ($rule->trading_account_id) {
            $account = TradingAccount::where('id', $rule->trading_account_id)
                ->where('user_id', $user->id)
                ->first();
            if ($account) {
                EvaluateAccountMetricsJob::dispatch($account->id);
            }
        } else {
            TradingAccount::where('user_id', $user->id)->pluck('id')->each(function (int $accountId): void {
                EvaluateAccountMetricsJob::dispatch($accountId);
            });
        }

        $rule->delete();

        return response()->json([
            'success' => true,
            'message' => 'Trading rule deleted successfully',
        ]);
    }

    protected function applyRuleToAccount(TradingRule $rule, TradingAccount $account): void
    {
        $startingBalance = (float) $rule->starting_balance;
        $profitTargetPercent = (float) $rule->profit_target_percent;

        $account->initial_balance = $startingBalance;
        if ($account->current_balance === null) {
            $account->current_balance = $startingBalance;
        }

        // Store concrete values in account for a single source of truth in risk engine.
        $account->profit_target = round(($startingBalance * $profitTargetPercent) / 100, 2);
        $account->daily_drawdown_limit_percent = (int) round((float) $rule->max_daily_loss_percent);
        $account->consistency_rule_percent = (int) round((float) $rule->consistency_threshold_percent);
        $account->save();

        EvaluateAccountMetricsJob::dispatchSync($account->id);
    }

    protected function enforceRuleGuardrails(array $payload): void
    {
        $ruleType = (string) ($payload['consistency_rule_type'] ?? 'custom');
        $threshold = isset($payload['consistency_threshold_percent'])
            ? (float) $payload['consistency_threshold_percent']
            : null;

        if ($ruleType === '40' && $threshold !== null && abs($threshold - 40.0) > 0.0001) {
            throw ValidationException::withMessages([
                'consistency_threshold_percent' => 'For rule type 40, threshold must be exactly 40%.',
            ]);
        }

        if ($ruleType === '15' && $threshold !== null && abs($threshold - 15.0) > 0.0001) {
            throw ValidationException::withMessages([
                'consistency_threshold_percent' => 'For rule type 15, threshold must be exactly 15%.',
            ]);
        }

        if ($ruleType === 'custom' && $threshold !== null && ($threshold < 1 || $threshold > 100)) {
            throw ValidationException::withMessages([
                'consistency_threshold_percent' => 'Custom consistency threshold must be between 1 and 100.',
            ]);
        }

        $dailyLoss = isset($payload['max_daily_loss_percent']) ? (float) $payload['max_daily_loss_percent'] : null;
        $singleTrade = isset($payload['max_single_trade_percent']) ? (float) $payload['max_single_trade_percent'] : null;
        if ($dailyLoss !== null && $singleTrade !== null && $singleTrade > $dailyLoss) {
            throw ValidationException::withMessages([
                'max_single_trade_percent' => 'Max single trade percent cannot be greater than max daily loss percent.',
            ]);
        }
    }
}
