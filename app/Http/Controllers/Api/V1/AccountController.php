<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Jobs\EvaluateAccountMetricsJob;
use App\Models\TradingAccount;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

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

    public function setupStatus(Request $request, TradingAccount $account)
    {
        $this->authorize('view', $account);

        $accountCount = TradingAccount::where('user_id', $request->user()->id)->count();
        $tradeCount = $account->trades()->count();
        $completedImports = $account->importBatches()->where('status', 'completed')->count();

        $hasRulesConfigured =
            (float) $account->profit_target > 0
            && ((bool) ($account->consistency_rule_enabled ?? true) === false || (float) $account->consistency_rule_percent > 0)
            && (float) $account->daily_drawdown_limit_percent > 0;

        $hasTimezoneConfigured =
            !empty($account->timezone)
            && !empty($account->trading_day_reset_timezone)
            && !empty($account->trading_day_reset_time);

        $hasAnyDataSource = $tradeCount > 0 || $completedImports > 0;
        $setupPercent = collect([
            !empty($account->account_name),
            $hasRulesConfigured,
            $hasTimezoneConfigured,
            $hasAnyDataSource,
        ])->filter()->count() / 4 * 100;

        return response()->json([
            'success' => true,
            'data' => [
                'account_id' => $account->id,
                'mode' => $accountCount > 1 ? 'portfolio' : 'single',
                'progress_percent' => round($setupPercent, 2),
                'steps' => [
                    'identity' => [
                        'complete' => !empty($account->account_name),
                        'label' => 'Identity & Account',
                    ],
                    'rules' => [
                        'complete' => $hasRulesConfigured,
                        'label' => 'Rules & Guardrails',
                    ],
                    'timezone' => [
                        'complete' => $hasTimezoneConfigured,
                        'label' => 'Timezone & Reset Clock',
                    ],
                    'data_activation' => [
                        'complete' => $hasAnyDataSource,
                        'label' => 'Data Activation',
                        'source' => [
                            'manual_trades' => $tradeCount,
                            'imports' => $completedImports,
                        ],
                    ],
                ],
                'next_action' => match (true) {
                    empty($account->account_name) => 'set_account_identity',
                    !$hasRulesConfigured => 'configure_rules',
                    !$hasTimezoneConfigured => 'set_timezone_reset',
                    !$hasAnyDataSource => 'add_or_import_first_trade',
                    default => 'setup_complete',
                },
            ],
            'message' => 'Account setup status',
        ]);
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
            'timezone' => 'nullable|timezone',
            'trading_day_reset_timezone' => 'nullable|timezone',
            'trading_day_reset_time' => ['nullable', 'regex:/^([01]\d|2[0-3]):([0-5]\d)$/'],
            'status' => 'nullable|in:active,passed,breached',
            'default_strategy_tag' => 'nullable|string|max:120',
            'trader_full_name' => 'nullable|string|max:120',
            'trader_country' => 'nullable|string|max:80',
            'trader_experience_level' => 'nullable|string|max:40',
            'consistency_rule_enabled' => 'nullable|boolean',
        ]);

        $data['user_id'] = $user->id;
        $data['current_balance'] = $data['current_balance'] ?? $data['initial_balance'];
        $this->enforceAccountGuardrails($data);

        $account = TradingAccount::create($data);
        EvaluateAccountMetricsJob::dispatchSync($account->id);

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
            'timezone' => 'sometimes|timezone',
            'trading_day_reset_timezone' => 'sometimes|timezone',
            'trading_day_reset_time' => ['sometimes', 'regex:/^([01]\d|2[0-3]):([0-5]\d)$/'],
            'status' => 'sometimes|in:active,passed,breached',
            'default_strategy_tag' => 'sometimes|nullable|string|max:120',
            'trader_full_name' => 'sometimes|nullable|string|max:120',
            'trader_country' => 'sometimes|nullable|string|max:80',
            'trader_experience_level' => 'sometimes|nullable|string|max:40',
            'consistency_rule_enabled' => 'sometimes|boolean',
        ]);

        $candidate = array_merge($account->toArray(), $data);
        $this->enforceAccountGuardrails($candidate);
        $account->update($data);
        EvaluateAccountMetricsJob::dispatchSync($account->id);

        return response()->json(['success' => true, 'data' => $account->fresh(), 'message' => 'Account updated']);
    }

    protected function enforceAccountGuardrails(array $payload): void
    {
        $initial = isset($payload['initial_balance']) ? (float) $payload['initial_balance'] : 0.0;
        $target = isset($payload['profit_target']) ? (float) $payload['profit_target'] : 0.0;
        $daily = isset($payload['daily_drawdown_limit_percent']) ? (float) $payload['daily_drawdown_limit_percent'] : null;
        $maxLoss = isset($payload['max_loss_limit_percent']) ? (float) $payload['max_loss_limit_percent'] : null;

        if ($initial > 0 && $target > $initial) {
            throw ValidationException::withMessages([
                'profit_target' => 'Profit target cannot be greater than initial balance.',
            ]);
        }

        if ($daily !== null && $maxLoss !== null && $daily > $maxLoss) {
            throw ValidationException::withMessages([
                'daily_drawdown_limit_percent' => 'Daily drawdown limit cannot be greater than max loss limit.',
            ]);
        }
    }
}
