<?php

namespace Tests\Feature;

use App\Models\Trade;
use App\Models\TradingAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_endpoints_return_expected_shapes(): void
    {
        $user = User::factory()->create();
        $account = TradingAccount::factory()->create(['user_id' => $user->id]);
        $token = $user->createToken('test-token', ['*'])->plainTextToken;

        Trade::factory()->create([
            'account_id' => $account->id,
            'symbol' => 'EURUSD',
            'type' => 'buy',
            'pnl' => 120.50,
            'close_time' => now()->subDays(2),
            'strategy_tag' => 'Silver Bullet',
        ]);
        Trade::factory()->create([
            'account_id' => $account->id,
            'symbol' => 'GBPUSD',
            'type' => 'sell',
            'pnl' => -45.25,
            'close_time' => now()->subDay(),
            'strategy_tag' => 'Judas Swing',
        ]);
        Trade::factory()->create([
            'account_id' => $account->id,
            'symbol' => 'EURUSD',
            'type' => 'buy',
            'pnl' => 80.00,
            'close_time' => now(),
            'strategy_tag' => 'Silver Bullet',
        ]);

        $this->withToken($token)
            ->getJson("/api/v1/accounts/{$account->id}/dashboard/summary")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.account.id', $account->id);

        $this->withToken($token)
            ->getJson("/api/v1/accounts/{$account->id}/dashboard/equity-curve?days=30")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['days', 'series']]);

        $this->withToken($token)
            ->getJson("/api/v1/accounts/{$account->id}/dashboard/recent-trades?symbol=EUR&type=buy&per_page=8")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.per_page', 8);

        $this->withToken($token)
            ->getJson("/api/v1/accounts/{$account->id}/dashboard/performance-by-symbol")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => [['symbol', 'trades', 'win_rate', 'pnl', 'avg_win', 'avg_loss']]]);

        $this->withToken($token)
            ->getJson("/api/v1/accounts/{$account->id}/dashboard/win-loss-distribution?days=5")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['days', 'series', 'totals' => ['wins', 'losses', 'win_rate']]]);
    }

    public function test_dashboard_endpoints_are_forbidden_for_other_users(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $account = TradingAccount::factory()->create(['user_id' => $owner->id]);
        $intruderToken = $intruder->createToken('test-token', ['*'])->plainTextToken;

        $paths = [
            "/api/v1/accounts/{$account->id}/dashboard/summary",
            "/api/v1/accounts/{$account->id}/dashboard/equity-curve",
            "/api/v1/accounts/{$account->id}/dashboard/recent-trades",
            "/api/v1/accounts/{$account->id}/dashboard/performance-by-symbol",
            "/api/v1/accounts/{$account->id}/dashboard/win-loss-distribution",
        ];

        foreach ($paths as $path) {
            $this->withToken($intruderToken)
                ->getJson($path)
                ->assertForbidden();
        }
    }
}

