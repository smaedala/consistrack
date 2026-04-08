<?php

namespace Tests\Feature;

use App\Models\Trade;
use App\Models\TradeImportBatch;
use App\Models\TradingAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AccountSetupStatusApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_setup_status_returns_progress_and_next_action(): void
    {
        $user = User::factory()->create();
        $account = TradingAccount::factory()->create([
            'user_id' => $user->id,
            'account_name' => 'FTMO 100k',
            'profit_target' => 10000,
            'consistency_rule_percent' => 40,
            'daily_drawdown_limit_percent' => 5,
            'timezone' => 'UTC',
            'trading_day_reset_timezone' => 'America/New_York',
            'trading_day_reset_time' => '17:00',
        ]);

        Trade::factory()->create([
            'account_id' => $account->id,
            'symbol' => 'EURUSD',
            'type' => 'buy',
            'pnl' => 250.00,
            'close_time' => now(),
        ]);

        TradeImportBatch::create([
            'uuid' => (string) Str::uuid(),
            'account_id' => $account->id,
            'source' => 'csv',
            'status' => 'completed',
            'total_rows' => 1,
            'imported_count' => 1,
            'imported_at' => now(),
        ]);

        $token = $user->createToken('test-token', ['*'])->plainTextToken;

        $this->withToken($token)
            ->getJson("/api/v1/accounts/{$account->id}/setup-status")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.next_action', 'setup_complete')
            ->assertJsonPath('data.steps.identity.complete', true)
            ->assertJsonPath('data.steps.rules.complete', true)
            ->assertJsonPath('data.steps.timezone.complete', true)
            ->assertJsonPath('data.steps.data_activation.complete', true);
    }

    public function test_setup_status_is_forbidden_for_non_owner(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $account = TradingAccount::factory()->create(['user_id' => $owner->id]);
        $token = $intruder->createToken('test-token', ['*'])->plainTextToken;

        $this->withToken($token)
            ->getJson("/api/v1/accounts/{$account->id}/setup-status")
            ->assertForbidden();
    }
}
