<?php

namespace Tests\Feature;

use App\Models\TradingAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiConsistencyValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_rule_endpoints_return_success_key(): void
    {
        $user = User::factory()->create();
        $account = TradingAccount::factory()->create(['user_id' => $user->id]);
        $token = $user->createToken('test-token', ['*'])->plainTextToken;

        $create = $this->withToken($token)->postJson('/api/v1/rules', [
            'trading_account_id' => $account->id,
            'starting_balance' => 100000,
            'profit_target_percent' => 10,
            'max_daily_loss_percent' => 5,
            'consistency_rule_type' => '40',
            'consistency_threshold_percent' => 40,
        ])->assertOk()->assertJsonPath('success', true);

        $ruleId = $create->json('data.id');

        $this->withToken($token)
            ->getJson('/api/v1/rules')
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->withToken($token)
            ->deleteJson("/api/v1/rules/{$ruleId}")
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_csv_import_requires_exactly_one_input_mode(): void
    {
        $user = User::factory()->create();
        $account = TradingAccount::factory()->create(['user_id' => $user->id]);
        $otherAccount = TradingAccount::factory()->create(['user_id' => $user->id]);
        $token = $user->createToken('test-token', ['*'])->plainTextToken;

        $this->withToken($token)
            ->postJson("/api/v1/accounts/{$account->id}/import-csv", [])
            ->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->withToken($token)
            ->postJson("/api/v1/accounts/{$account->id}/import-csv", [
                'account_id' => $otherAccount->id,
                'parsed_trades' => [],
            ])
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_manual_trade_duplicate_is_blocked_with_conflict(): void
    {
        $user = User::factory()->create();
        $account = TradingAccount::factory()->create(['user_id' => $user->id]);
        $token = $user->createToken('test-token', ['*'])->plainTextToken;

        $payload = [
            'symbol' => 'EURUSD',
            'type' => 'buy',
            'lot_size' => 0.10,
            'pnl' => 100.00,
            'close_time' => now()->subMinute()->toISOString(),
            'strategy_tag' => 'Silver Bullet',
        ];

        $this->withToken($token)
            ->postJson("/api/v1/accounts/{$account->id}/trades", $payload)
            ->assertCreated();

        $this->withToken($token)
            ->postJson("/api/v1/accounts/{$account->id}/trades", $payload)
            ->assertStatus(409)
            ->assertJsonPath('success', false);
    }
}
