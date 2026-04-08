<?php

namespace Tests\Feature;

use App\Models\Trade;
use App\Models\TradingAccount;
use App\Models\User;
use Carbon\Carbon;
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

        $this->withToken($token)
            ->getJson("/api/v1/accounts/{$account->id}/dashboard/trading-activity?month=" . now()->format('Y-m'))
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'month',
                    'month_label',
                    'week_days',
                    'days' => [[
                        'date',
                        'day',
                        'in_current_month',
                        'trades',
                        'pnl',
                        'status',
                    ]],
                    'summary' => [
                        'total_trades',
                        'total_pnl',
                        'profitable_days',
                        'losing_days',
                        'no_trade_days',
                    ],
                ],
            ]);
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
            "/api/v1/accounts/{$account->id}/dashboard/trading-activity",
        ];

        foreach ($paths as $path) {
            $this->withToken($intruderToken)
                ->getJson($path)
                ->assertForbidden();
        }
    }

    public function test_trading_activity_calendar_uses_24h_calendar_day_not_firm_reset_shift(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-04-07 10:00:00', 'UTC'));

        $user = User::factory()->create();
        $account = TradingAccount::factory()->create([
            'user_id' => $user->id,
            'timezone' => 'UTC',
            'trading_day_reset_timezone' => 'America/New_York',
            'trading_day_reset_time' => '17:00',
        ]);
        $token = $user->createToken('test-token', ['*'])->plainTextToken;

        // Trade placed on same UTC calendar day before the 17:00 reset boundary.
        Trade::factory()->create([
            'account_id' => $account->id,
            'symbol' => 'EURUSD',
            'type' => 'buy',
            'pnl' => 125.00,
            'close_time' => Carbon::parse('2026-04-07 09:30:00', 'UTC'),
        ]);

        $response = $this->withToken($token)
            ->getJson("/api/v1/accounts/{$account->id}/dashboard/trading-activity?month=2026-04")
            ->assertOk()
            ->assertJsonPath('success', true);

        $days = collect($response->json('data.days'));
        $todayCell = $days->firstWhere('date', '2026-04-07');
        $this->assertNotNull($todayCell);
        $this->assertSame(1, (int) ($todayCell['trades'] ?? 0));
        $this->assertSame('profit', $todayCell['status'] ?? '');

        Carbon::setTestNow();
    }
}
