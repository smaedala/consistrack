<?php

namespace Tests\Feature;

use App\Models\Trade;
use App\Models\TradingAccount;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AddTradePreviewApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_preview_returns_safe_state_when_well_below_limit(): void
    {
        [$user, $account, $token] = $this->makeUserAccountToken(20);

        // Max day 100 / total 600 = 16.67% -> safe for 20% limit.
        $this->seedDayPnls($account, [100, 100, 100, 100, 100, 100]);

        $this->withToken($token)
            ->postJson("/api/v1/accounts/{$account->id}/trades/preview", [
                'pnl' => 0,
                'close_time' => now()->toISOString(),
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.state', 'safe');
    }

    public function test_preview_returns_caution_state_when_within_two_percent_of_limit(): void
    {
        [$user, $account, $token] = $this->makeUserAccountToken(20);

        // Max day 180 / total 1000 = 18% -> caution zone for 20% limit.
        $this->seedDayPnls($account, [180, 170, 170, 170, 170, 140]);

        $this->withToken($token)
            ->postJson("/api/v1/accounts/{$account->id}/trades/preview", [
                'pnl' => 0,
                'close_time' => now()->toISOString(),
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.state', 'caution');
    }

    public function test_preview_returns_breach_state_when_above_limit(): void
    {
        [$user, $account, $token] = $this->makeUserAccountToken(20);

        // Max day 250 / total 1000 = 25% -> breach for 20% limit.
        $this->seedDayPnls($account, [250, 250, 250, 250]);

        $this->withToken($token)
            ->postJson("/api/v1/accounts/{$account->id}/trades/preview", [
                'pnl' => 0,
                'close_time' => now()->toISOString(),
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.state', 'breach')
            ->assertJsonPath('data.consistency_limit_percent', 20);
    }

    public function test_preview_is_forbidden_for_non_owner(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $account = TradingAccount::factory()->create(['user_id' => $owner->id]);
        $token = $intruder->createToken('test-token', ['*'])->plainTextToken;

        $this->withToken($token)
            ->postJson("/api/v1/accounts/{$account->id}/trades/preview", [
                'pnl' => 100,
            ])
            ->assertForbidden();
    }

    public function test_preview_returns_exact_consistency_percentage_without_artificial_cap(): void
    {
        [$user, $account, $token] = $this->makeUserAccountToken(20);

        // Max day 500 / total 100 = 500% (after loss day), should remain exact.
        $this->seedDayPnls($account, [500, -400]);

        $this->withToken($token)
            ->postJson("/api/v1/accounts/{$account->id}/trades/preview", [
                'pnl' => 0,
                'close_time' => now()->toISOString(),
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.raw_projected_consistency_percent', 500)
            ->assertJsonPath('data.projected_consistency_percent', 500)
            ->assertJsonPath('data.max_allowed_day_profit', 20);
    }

    private function makeUserAccountToken(int $consistencyLimitPercent): array
    {
        $user = User::factory()->create();
        $account = TradingAccount::factory()->create([
            'user_id' => $user->id,
            'consistency_rule_percent' => $consistencyLimitPercent,
        ]);
        $token = $user->createToken('test-token', ['*'])->plainTextToken;

        return [$user, $account, $token];
    }

    /**
     * @param array<int,float|int> $pnls
     */
    private function seedDayPnls(TradingAccount $account, array $pnls): void
    {
        foreach ($pnls as $index => $pnl) {
            Trade::factory()->create([
                'account_id' => $account->id,
                'symbol' => 'EURUSD',
                'type' => 'buy',
                'pnl' => $pnl,
                'close_time' => now()->subDays($index + 1),
            ]);
        }
    }

    public function test_preview_uses_24h_calendar_day_for_consistency_projection(): void
    {
        [$user, $account, $token] = $this->makeUserAccountToken(40);
        $account->update([
            'timezone' => 'UTC',
            'trading_day_reset_timezone' => 'UTC',
            'trading_day_reset_time' => '17:00',
            'profit_target' => 4000,
        ]);

        Trade::factory()->create([
            'account_id' => $account->id,
            'symbol' => 'EURUSD',
            'type' => 'buy',
            'pnl' => 1000,
            'close_time' => Carbon::parse('2026-04-01 16:30:00', 'UTC'),
        ]);

        Trade::factory()->create([
            'account_id' => $account->id,
            'symbol' => 'EURUSD',
            'type' => 'buy',
            'pnl' => 1000,
            'close_time' => Carbon::parse('2026-04-01 17:30:00', 'UTC'),
        ]);

        $this->withToken($token)
            ->postJson("/api/v1/accounts/{$account->id}/trades/preview", [
                'pnl' => 0,
                'close_time' => Carbon::parse('2026-04-01 18:00:00', 'UTC')->toISOString(),
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.projected_max_day_profit', 2000)
            ->assertJsonPath('data.projected_total_profit', 2000)
            ->assertJsonPath('data.projected_consistency_percent', 100);
    }
}
