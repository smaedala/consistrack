<?php

namespace Tests\Feature;

use App\Models\TradingAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ActivityLogApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_activity_log_contains_trade_and_import_events(): void
    {
        $user = User::factory()->create();
        $account = TradingAccount::factory()->create(['user_id' => $user->id]);
        $token = $user->createToken('test-token', ['*'])->plainTextToken;

        $this->withToken($token)->postJson("/api/v1/accounts/{$account->id}/trades", [
            'symbol' => 'EURUSD',
            'type' => 'buy',
            'lot_size' => 0.10,
            'pnl' => 120.50,
            'close_time' => now()->subMinute()->toISOString(),
            'strategy_tag' => 'Silver Bullet',
        ])->assertCreated();

        $import = $this->withToken($token)->postJson("/api/v1/accounts/{$account->id}/import-csv", [
            'parsed_trades' => [
                [
                    'symbol' => 'GBPUSD',
                    'type' => 'sell',
                    'lot_size' => 0.20,
                    'pnl' => 75.00,
                    'close_time' => now()->subMinutes(2)->toISOString(),
                    'external_id' => 'ACT-1',
                ],
            ],
        ])->assertOk();

        $batchUuid = $import->json('data.batch_uuid');
        $this->withToken($token)
            ->deleteJson("/api/v1/accounts/{$account->id}/imports/{$batchUuid}")
            ->assertOk();

        $this->withToken($token)
            ->getJson("/api/v1/accounts/{$account->id}/activity")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.total', 3);
    }

    public function test_activity_log_is_forbidden_for_non_owner(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $account = TradingAccount::factory()->create(['user_id' => $owner->id]);
        $token = $intruder->createToken('test-token', ['*'])->plainTextToken;

        $this->withToken($token)
            ->getJson("/api/v1/accounts/{$account->id}/activity")
            ->assertForbidden();
    }
}

