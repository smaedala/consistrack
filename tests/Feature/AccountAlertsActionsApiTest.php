<?php

namespace Tests\Feature;

use App\Models\AccountAlert;
use App\Models\TradingAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccountAlertsActionsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_acknowledge_and_snooze_own_alert(): void
    {
        $user = User::factory()->create();
        $account = TradingAccount::factory()->create(['user_id' => $user->id]);
        $alert = AccountAlert::create([
            'account_id' => $account->id,
            'alert_type' => 'drawdown',
            'level' => 'warning',
            'payload' => ['risk_percent_of_limit' => 78],
        ]);

        $token = $user->createToken('test-token', ['*'])->plainTextToken;

        $this->withToken($token)
            ->patchJson("/api/v1/accounts/{$account->id}/alerts/{$alert->id}/acknowledge")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $alert->id);

        $this->withToken($token)
            ->patchJson("/api/v1/accounts/{$account->id}/alerts/{$alert->id}/snooze", ['minutes' => 30])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $alert->id);

        $list = $this->withToken($token)
            ->getJson("/api/v1/accounts/{$account->id}/alerts")
            ->assertOk()
            ->json('data');

        $this->assertCount(0, $list);

        $listIncludingSnoozed = $this->withToken($token)
            ->getJson("/api/v1/accounts/{$account->id}/alerts?include_snoozed=1")
            ->assertOk()
            ->json('data');

        $this->assertCount(1, $listIncludingSnoozed);
    }

    public function test_user_cannot_manage_alert_from_another_account(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();

        $account = TradingAccount::factory()->create(['user_id' => $owner->id]);
        $alert = AccountAlert::create([
            'account_id' => $account->id,
            'alert_type' => 'consistency',
            'level' => 'critical',
            'payload' => ['risk_percent_of_limit' => 120],
        ]);

        $token = $intruder->createToken('test-token', ['*'])->plainTextToken;

        $this->withToken($token)
            ->patchJson("/api/v1/accounts/{$account->id}/alerts/{$alert->id}/acknowledge")
            ->assertForbidden();
    }
}
