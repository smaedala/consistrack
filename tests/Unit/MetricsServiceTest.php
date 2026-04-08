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
        $this->assertEquals(94.12, $metrics['consistencyScorePercent']);
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
        $this->assertEquals(100.0, $metrics['consistencyScorePercent']);
        $this->assertEquals('breached', $metrics['status']);
    }

    public function test_consistency_uses_24h_calendar_day_not_reset_boundary()
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

        // Same calendar date, split by 17:00 reset boundary.
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

        // For consistency (24h calendar day), these should merge into 2000.
        $this->assertEquals(2000.0, $metrics['topDailyProfit']);
        $this->assertEquals(50.0, $metrics['topDailyPercentOfTarget']);
        $this->assertEquals(100.0, $metrics['consistencyScorePercent']);
        $this->assertEquals('breached', $metrics['status']);
    }

    public function test_daily_loss_is_zero_when_today_profit_offsets_losses(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-04-07 12:00:00', 'UTC'));

        $user = \App\Models\User::factory()->create();
        $account = TradingAccount::factory()->create([
            'initial_balance' => 10000,
            'daily_drawdown_limit_percent' => 5,
            'timezone' => 'UTC',
            'user_id' => $user->id,
        ]);

        Trade::factory()->create([
            'account_id' => $account->id,
            'pnl' => -300,
            'close_time' => Carbon::parse('2026-04-07 09:00:00', 'UTC'),
        ]);
        Trade::factory()->create([
            'account_id' => $account->id,
            'pnl' => 500,
            'close_time' => Carbon::parse('2026-04-07 10:00:00', 'UTC'),
        ]);

        $metrics = (new MetricsService())->evaluate($account);
        $this->assertEquals(0.0, $metrics['dailyDrawdownPercent']);

        Carbon::setTestNow();
    }

    public function test_daily_loss_uses_today_net_loss_after_profit_offset(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-04-07 12:00:00', 'UTC'));

        $user = \App\Models\User::factory()->create();
        $account = TradingAccount::factory()->create([
            'initial_balance' => 10000,
            'daily_drawdown_limit_percent' => 5,
            'timezone' => 'UTC',
            'user_id' => $user->id,
        ]);

        Trade::factory()->create([
            'account_id' => $account->id,
            'pnl' => -500,
            'close_time' => Carbon::parse('2026-04-07 09:00:00', 'UTC'),
        ]);
        Trade::factory()->create([
            'account_id' => $account->id,
            'pnl' => 200,
            'close_time' => Carbon::parse('2026-04-07 10:00:00', 'UTC'),
        ]);

        $metrics = (new MetricsService())->evaluate($account);
        // Net loss = 300 => 3% of initial 10,000.
        $this->assertEquals(3.0, $metrics['dailyDrawdownPercent']);

        Carbon::setTestNow();
    }
}
