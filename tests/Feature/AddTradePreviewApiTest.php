<?php

namespace Tests\Feature;

use App\Models\Trade;
use App\Models\TradingAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AddTradePreviewApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_preview_returns_safe_state_when_well_below_limit(): void
    {
        [$user, $account, $token] = $this->makeUserAccountToken(20);

        // profit_target factory default: 4000; 20% limit => max allowed day profit = 800
        $this->seedDayPnls($account, [600, 400, 300]);

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

        // Caution starts at (limit - 2)% => 18% of 4000 = 720
        $this->seedDayPnls($account, [760, 300, 200]);

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

        $this->seedDayPnls($account, [900, 250, 100]);

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

    public function test_preview_caps_consistency_percentage_at_100_for_ui_stability(): void
    {
        [$user, $account, $token] = $this->makeUserAccountToken(20);

        // Max day above target should cap display at 100 while preserving raw >100.
        $this->seedDayPnls($account, [5000]);

        $this->withToken($token)
            ->postJson("/api/v1/accounts/{$account->id}/trades/preview", [
                'pnl' => 0,
                'close_time' => now()->toISOString(),
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.raw_projected_consistency_percent', 125)
            ->assertJsonPath('data.projected_consistency_percent', 100)
            ->assertJsonPath('data.max_allowed_day_profit', 800);
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
}
