<?php

namespace Tests\Feature;

use App\Models\TradingAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GuardrailsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_rule_type_40_requires_threshold_40(): void
    {
        $user = User::factory()->create();
        $account = TradingAccount::factory()->create(['user_id' => $user->id]);
        $token = $user->createToken('test-token', ['*'])->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/v1/rules', [
                'trading_account_id' => $account->id,
                'starting_balance' => 100000,
                'profit_target_percent' => 10,
                'max_daily_loss_percent' => 5,
                'consistency_rule_type' => '40',
                'consistency_threshold_percent' => 35,
            ])
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.type', 'validation_error')
            ->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonStructure([
                'error' => [
                    'details' => [
                        'consistency_threshold_percent',
                    ],
                ],
            ]);
    }

    public function test_max_single_trade_cannot_exceed_daily_loss(): void
    {
        $user = User::factory()->create();
        $account = TradingAccount::factory()->create(['user_id' => $user->id]);
        $token = $user->createToken('test-token', ['*'])->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/v1/rules', [
                'trading_account_id' => $account->id,
                'starting_balance' => 100000,
                'profit_target_percent' => 10,
                'max_daily_loss_percent' => 3,
                'consistency_rule_type' => 'custom',
                'consistency_threshold_percent' => 20,
                'max_single_trade_percent' => 4,
            ])
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.type', 'validation_error')
            ->assertJsonStructure([
                'error' => [
                    'details' => [
                        'max_single_trade_percent',
                    ],
                ],
            ]);
    }

    public function test_account_profit_target_cannot_exceed_initial_balance(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token', ['*'])->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/v1/accounts', [
                'account_name' => 'Test Account',
                'initial_balance' => 10000,
                'current_balance' => 10000,
                'profit_target' => 15000,
                'consistency_rule_percent' => 40,
                'daily_drawdown_limit_percent' => 5,
                'max_loss_limit_percent' => 10,
            ])
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.type', 'validation_error')
            ->assertJsonStructure([
                'error' => [
                    'details' => [
                        'profit_target',
                    ],
                ],
            ]);
    }

    public function test_daily_drawdown_cannot_exceed_max_loss_limit(): void
    {
        $user = User::factory()->create();
        $account = TradingAccount::factory()->create([
            'user_id' => $user->id,
            'daily_drawdown_limit_percent' => 5,
            'max_loss_limit_percent' => 10,
        ]);
        $token = $user->createToken('test-token', ['*'])->plainTextToken;

        $this->withToken($token)
            ->putJson("/api/v1/accounts/{$account->id}", [
                'daily_drawdown_limit_percent' => 12,
                'max_loss_limit_percent' => 10,
            ])
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.type', 'validation_error')
            ->assertJsonStructure([
                'error' => [
                    'details' => [
                        'daily_drawdown_limit_percent',
                    ],
                ],
            ]);
    }
}
