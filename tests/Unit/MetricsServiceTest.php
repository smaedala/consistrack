<?php

namespace Tests\Unit;

use App\Models\Trade;
use App\Models\TradingAccount;
use App\Services\MetricsService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MetricsServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_top_daily_percent_and_breach_40()
    {
        $user = \App\Models\User::factory()->create();

        $account = TradingAccount::factory()->create([
            'initial_balance' => 10000,
            'profit_target' => 4000,
            'consistency_rule_percent' => 40,
            'user_id' => $user->id,
        ]);

        // Day 1: 1600 pnl (breach at 40%)
        Trade::factory()->create([ 'account_id' => $account->id, 'pnl' => 1600, 'close_time' => now()->subDays(2) ]);
        // Day 2: 100 pnl
        Trade::factory()->create([ 'account_id' => $account->id, 'pnl' => 100, 'close_time' => now()->subDay() ]);

        $metrics = (new MetricsService())->evaluate($account);

        $this->assertEquals(1600.0, $metrics['topDailyProfit']);
        $this->assertEquals(40.0, $metrics['topDailyPercentOfTarget']);
        $this->assertEquals('breached', $metrics['status']);
    }

    public function test_15_percent_rule()
    {
        $user = \App\Models\User::factory()->create();

        $account = TradingAccount::factory()->create([
            'initial_balance' => 10000,
            'profit_target' => 4000,
            'consistency_rule_percent' => 15,
            'user_id' => $user->id,
        ]);

        // Day with 700 pnl -> 17.5% -> breach
        Trade::factory()->create([ 'account_id' => $account->id, 'pnl' => 700, 'close_time' => now() ]);

        $metrics = (new MetricsService())->evaluate($account);

        $this->assertEquals(700.0, $metrics['topDailyProfit']);
        $this->assertEquals(17.5, $metrics['topDailyPercentOfTarget']);
        $this->assertEquals('breached', $metrics['status']);
    }

    public function test_trading_day_reset_time_is_respected_for_consistency_calculation()
    {
        $user = \App\Models\User::factory()->create();

        $account = TradingAccount::factory()->create([
            'initial_balance' => 10000,
            'profit_target' => 4000,
            'consistency_rule_percent' => 40,
            'timezone' => 'UTC',
            'trading_day_reset_timezone' => 'UTC',
            'trading_day_reset_time' => '17:00',
            'user_id' => $user->id,
        ]);

        // Same calendar date, but different trading days due to 17:00 reset.
        Trade::factory()->create([
            'account_id' => $account->id,
            'pnl' => 1000,
            'close_time' => Carbon::parse('2026-04-01 16:30:00', 'UTC'),
        ]);

        Trade::factory()->create([
            'account_id' => $account->id,
            'pnl' => 1000,
            'close_time' => Carbon::parse('2026-04-01 17:30:00', 'UTC'),
        ]);

        $metrics = (new MetricsService())->evaluate($account);

        // Top trading-day profit should be 1000 (not 2000 merged into same day).
        $this->assertEquals(1000.0, $metrics['topDailyProfit']);
        $this->assertEquals(25.0, $metrics['topDailyPercentOfTarget']);
        $this->assertEquals('active', $metrics['status']);
    }
}
