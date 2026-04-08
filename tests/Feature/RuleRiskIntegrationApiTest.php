<?php

namespace Tests\Feature;

use App\Models\AccountAlert;
use App\Models\TradingAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RuleRiskIntegrationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_account_specific_rule_syncs_to_account_and_recalculates_metrics(): void
    {
        $user = User::factory()->create();
        $account = TradingAccount::factory()->create([
            'user_id' => $user->id,
            'initial_balance' => 10000,
            'current_balance' => 10000,
            'profit_target' => 4000,
            'consistency_rule_percent' => 40,
            'daily_drawdown_limit_percent' => 5,
        ]);
        $token = $user->createToken('test-token', ['*'])->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/v1/rules', [
                'trading_account_id' => $account->id,
                'starting_balance' => 50000,
                'profit_target_percent' => 8,
                'max_daily_loss_percent' => 4,
                'consistency_rule_type' => 'custom',
                'consistency_threshold_percent' => 35,
                'max_single_trade_percent' => 2,
            ])
            ->assertOk();

        $account->refresh();
        $this->assertEquals(50000.0, (float) $account->initial_balance);
        $this->assertEquals(4000.0, (float) $account->profit_target); // 8% of 50,000
        $this->assertEquals(4, (int) $account->daily_drawdown_limit_percent);
        $this->assertEquals(35, (int) $account->consistency_rule_percent);

        $this->assertDatabaseHas('cached_account_metrics', [
            'account_id' => $account->id,
        ]);
    }

    public function test_dashboard_summary_includes_risk_status_from_alerts(): void
    {
        $user = User::factory()->create();
        $account = TradingAccount::factory()->create(['user_id' => $user->id]);
        $token = $user->createToken('test-token', ['*'])->plainTextToken;

        AccountAlert::create([
            'account_id' => $account->id,
            'alert_type' => 'drawdown',
            'level' => 'warning',
            'payload' => ['risk_percent_of_limit' => 78],
        ]);
        AccountAlert::create([
            'account_id' => $account->id,
            'alert_type' => 'consistency',
            'level' => 'critical',
            'payload' => ['risk_percent_of_limit' => 110],
        ]);

        $this->withToken($token)
            ->getJson("/api/v1/accounts/{$account->id}/dashboard/summary")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.risk_status.overall_level', 'critical')
            ->assertJsonStructure([
                'data' => [
                    'risk_status' => [
                        'overall_level',
                        'by_type' => [
                            '*' => ['type', 'level', 'payload', 'created_at'],
                        ],
                    ],
                ],
            ]);
    }
}
