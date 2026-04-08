<?php

namespace Tests\Feature;

use App\Jobs\EvaluateAccountMetricsJob;
use App\Models\Trade;
use App\Models\TradingAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConsistencyDisabledDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_consistency_disabled_keeps_dashboard_consistency_risk_at_zero(): void
    {
        $user = User::factory()->create();
        $account = TradingAccount::factory()->create([
            'user_id' => $user->id,
            'initial_balance' => 100000,
            'profit_target' => 10000,
            'consistency_rule_percent' => 10,
            'consistency_rule_enabled' => false,
            'daily_drawdown_limit_percent' => 5,
            'max_loss_limit_percent' => 10,
            'status' => 'active',
        ]);

        Trade::factory()->create([
            'account_id' => $account->id,
            'symbol' => 'EURUSD',
            'type' => 'buy',
            'pnl' => 6000,
            'close_time' => now()->subHour(),
        ]);

        EvaluateAccountMetricsJob::dispatchSync($account->id);

        $token = $user->createToken('test-token', ['*'])->plainTextToken;

        $summary = $this->withToken($token)
            ->getJson("/api/v1/accounts/{$account->id}/dashboard/summary")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSame(0.0, (float) $summary->json('data.metrics.consistencyScorePercent'));
        $this->assertSame(0.0, (float) $summary->json('data.metrics.consistencyRiskPercentOfLimit'));

        $metrics = $this->withToken($token)
            ->getJson("/api/v1/accounts/{$account->id}/metrics")
            ->assertOk();

        $this->assertSame(0.0, (float) $metrics->json('data.consistencyScorePercent'));
        $this->assertSame(0.0, (float) $metrics->json('data.consistencyRiskPercentOfLimit'));
    }

    public function test_consistency_alert_is_not_raised_as_warning_or_critical_when_disabled(): void
    {
        $user = User::factory()->create();
        $account = TradingAccount::factory()->create([
            'user_id' => $user->id,
            'consistency_rule_percent' => 10,
            'consistency_rule_enabled' => false,
        ]);

        Trade::factory()->create([
            'account_id' => $account->id,
            'pnl' => 5000,
            'close_time' => now()->subMinutes(10),
        ]);

        EvaluateAccountMetricsJob::dispatchSync($account->id);

        $token = $user->createToken('test-token', ['*'])->plainTextToken;

        $alerts = $this->withToken($token)
            ->getJson("/api/v1/accounts/{$account->id}/alerts")
            ->assertOk()
            ->json('data');

        $consistencyAlerts = collect($alerts)->where('alert_type', 'consistency')->values();
        if ($consistencyAlerts->isNotEmpty()) {
            $levels = $consistencyAlerts->pluck('level')->unique()->values()->all();
            $this->assertNotContains('critical', $levels);
            $this->assertNotContains('warning', $levels);
        }
    }
}
