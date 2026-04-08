<?php

namespace Tests\Feature;

use App\Models\Trade;
use App\Models\TradingAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReconcileMetricsCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_reconcile_command_rebuilds_metrics_for_active_accounts_only(): void
    {
        $user = User::factory()->create();

        $activeAccount = TradingAccount::factory()->create([
            'user_id' => $user->id,
            'status' => 'active',
            'initial_balance' => 10000,
            'current_balance' => 10000,
            'profit_target' => 1000,
        ]);

        $breachedAccount = TradingAccount::factory()->create([
            'user_id' => $user->id,
            'status' => 'breached',
            'initial_balance' => 10000,
            'current_balance' => 9000,
            'profit_target' => 1000,
        ]);

        Trade::factory()->create([
            'account_id' => $activeAccount->id,
            'symbol' => 'EURUSD',
            'type' => 'buy',
            'pnl' => 250,
            'close_time' => now()->subHour(),
        ]);

        Trade::factory()->create([
            'account_id' => $breachedAccount->id,
            'symbol' => 'GBPUSD',
            'type' => 'sell',
            'pnl' => -200,
            'close_time' => now()->subHour(),
        ]);

        $this->artisan('metrics:reconcile-accounts --status=active')
            ->assertExitCode(0);

        $this->assertDatabaseHas('cached_account_metrics', [
            'account_id' => $activeAccount->id,
        ]);
        $this->assertDatabaseHas('daily_account_stats', [
            'account_id' => $activeAccount->id,
        ]);

        $this->assertDatabaseMissing('cached_account_metrics', [
            'account_id' => $breachedAccount->id,
        ]);
        $this->assertDatabaseMissing('daily_account_stats', [
            'account_id' => $breachedAccount->id,
        ]);
    }
}

