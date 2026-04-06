<?php

namespace Tests\Feature;

use App\Models\TradingAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OwnershipApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_cannot_access_another_users_account_resources(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();

        $ownerAccount = TradingAccount::factory()->create([
            'user_id' => $owner->id,
        ]);

        $intruderToken = $intruder->createToken('test-token', ['*'])->plainTextToken;

        $this->withToken($intruderToken)
            ->getJson("/api/v1/accounts/{$ownerAccount->id}")
            ->assertForbidden();

        $this->withToken($intruderToken)
            ->getJson("/api/v1/accounts/{$ownerAccount->id}/metrics")
            ->assertForbidden();

        $this->withToken($intruderToken)
            ->getJson("/api/v1/accounts/{$ownerAccount->id}/alerts")
            ->assertForbidden();

        $this->withToken($intruderToken)
            ->postJson("/api/v1/accounts/{$ownerAccount->id}/trades", [
                'symbol' => 'EURUSD',
                'type' => 'buy',
                'lot_size' => 0.50,
                'entry_price' => 1.1000,
                'exit_price' => 1.1050,
                'pnl' => 125.75,
                'close_time' => now()->toISOString(),
            ])
            ->assertForbidden();
    }
}

