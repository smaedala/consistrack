<?php

namespace Tests\Feature;

use App\Models\DailyAccountStat;
use App\Models\TradingAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DailyAccountSnapshotApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_trade_generates_daily_snapshot_and_metrics_reads_it(): void
    {
        $user = User::factory()->create();
        $account = TradingAccount::factory()->create(['user_id' => $user->id]);
        $token = $user->createToken('test-token', ['*'])->plainTextToken;

        $this->withToken($token)
            ->postJson("/api/v1/accounts/{$account->id}/trades", [
                'symbol' => 'EURUSD',
                'type' => 'buy',
                'lot_size' => 0.30,
                'entry_price' => 1.1000,
                'exit_price' => 1.1020,
                'pnl' => 80.25,
                'close_time' => now()->toISOString(),
            ])
            ->assertCreated();

        $snapshot = DailyAccountStat::where('account_id', $account->id)->first();
        $this->assertNotNull($snapshot);
        $this->assertArrayHasKey('currentBalance', (array) $snapshot->metrics);

        $this->withToken($token)
            ->getJson("/api/v1/accounts/{$account->id}/metrics")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Daily snapshot metrics')
            ->assertJsonPath('data.currentBalance', (float) ($account->initial_balance + 80.25));
    }
}

