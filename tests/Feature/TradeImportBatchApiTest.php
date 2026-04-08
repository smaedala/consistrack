<?php

namespace Tests\Feature;

use App\Models\Trade;
use App\Models\TradeImportBatch;
use App\Models\TradingAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TradeImportBatchApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_list_import_batches_for_account(): void
    {
        $user = User::factory()->create();
        $account = TradingAccount::factory()->create(['user_id' => $user->id]);
        $token = $user->createToken('test-token', ['*'])->plainTextToken;

        TradeImportBatch::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'account_id' => $account->id,
            'source' => 'parsed',
            'status' => 'completed',
            'total_rows' => 2,
            'imported_count' => 2,
            'duplicate_count' => 0,
            'error_count' => 0,
            'imported_at' => now(),
        ]);

        $this->withToken($token)
            ->getJson("/api/v1/accounts/{$account->id}/imports")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.total', 1);
    }

    public function test_user_cannot_list_import_batches_for_other_users_account(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $account = TradingAccount::factory()->create(['user_id' => $owner->id]);
        $token = $intruder->createToken('test-token', ['*'])->plainTextToken;

        $this->withToken($token)
            ->getJson("/api/v1/accounts/{$account->id}/imports")
            ->assertForbidden();
    }

    public function test_import_is_atomic_and_rolls_back_on_invalid_trade_payload(): void
    {
        $user = User::factory()->create();
        $account = TradingAccount::factory()->create(['user_id' => $user->id]);
        $token = $user->createToken('test-token', ['*'])->plainTextToken;

        $payload = [
            'parsed_trades' => [
                [
                    'symbol' => 'EURUSD',
                    'type' => 'buy',
                    'lot_size' => 0.50,
                    'entry_price' => 1.1000,
                    'exit_price' => 1.1020,
                    'pnl' => 100.50,
                    'close_time' => now()->subMinutes(30)->toISOString(),
                    'external_id' => 'T-1001',
                ],
                [
                    'symbol' => 'GBPUSD',
                    // missing `type` => should fail and rollback full batch
                    'lot_size' => 0.20,
                    'pnl' => 50.00,
                    'close_time' => now()->toISOString(),
                    'external_id' => 'T-1002',
                ],
            ],
        ];

        $response = $this->withToken($token)
            ->postJson("/api/v1/accounts/{$account->id}/import-csv", $payload);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Import validation failed.')
            ->assertJsonStructure(['data' => ['batch_uuid', 'errors' => [['row', 'message']]]]);

        $this->assertDatabaseCount('trades', 0);

        $failedBatch = TradeImportBatch::where('account_id', $account->id)->latest()->first();
        $this->assertNotNull($failedBatch);
        $this->assertSame('failed', $failedBatch->status);
        $this->assertSame(1, (int) $failedBatch->error_count);
    }

    public function test_user_can_undo_import_batch(): void
    {
        $user = User::factory()->create();
        $account = TradingAccount::factory()->create(['user_id' => $user->id]);
        $token = $user->createToken('test-token', ['*'])->plainTextToken;

        $payload = [
            'parsed_trades' => [
                [
                    'symbol' => 'EURUSD',
                    'type' => 'buy',
                    'lot_size' => 0.50,
                    'entry_price' => 1.1000,
                    'exit_price' => 1.1020,
                    'pnl' => 100.50,
                    'close_time' => now()->subMinutes(30)->toISOString(),
                    'external_id' => 'BATCH-T-2001',
                ],
                [
                    'symbol' => 'GBPUSD',
                    'type' => 'sell',
                    'lot_size' => 0.20,
                    'entry_price' => 1.2500,
                    'exit_price' => 1.2450,
                    'pnl' => 125.00,
                    'close_time' => now()->toISOString(),
                    'external_id' => 'BATCH-T-2002',
                ],
            ],
        ];

        $importResponse = $this->withToken($token)
            ->postJson("/api/v1/accounts/{$account->id}/import-csv", $payload)
            ->assertOk()
            ->assertJsonPath('success', true);

        $batchUuid = $importResponse->json('data.batch_uuid');
        $this->assertNotEmpty($batchUuid);
        $this->assertSame(2, Trade::where('account_id', $account->id)->count());

        $this->withToken($token)
            ->deleteJson("/api/v1/accounts/{$account->id}/imports/{$batchUuid}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.deleted_trades', 2);

        $this->assertSame(0, Trade::where('account_id', $account->id)->count());

        $batch = TradeImportBatch::where('uuid', $batchUuid)->firstOrFail();
        $this->assertSame('reverted', $batch->status);
    }

    public function test_import_idempotency_key_replays_previous_result_without_new_batch(): void
    {
        $user = User::factory()->create();
        $account = TradingAccount::factory()->create(['user_id' => $user->id]);
        $token = $user->createToken('test-token', ['*'])->plainTextToken;

        $payload = [
            'idempotency_key' => 'import-key-001',
            'parsed_trades' => [
                [
                    'symbol' => 'EURUSD',
                    'type' => 'buy',
                    'lot_size' => 0.5,
                    'pnl' => 200,
                    'close_time' => now()->subHour()->toISOString(),
                    'external_id' => 'IK-1',
                ],
            ],
        ];

        $first = $this->withToken($token)
            ->postJson("/api/v1/accounts/{$account->id}/import-csv", $payload)
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.idempotent_replay', false);

        $firstBatchUuid = $first->json('data.batch_uuid');

        $this->withToken($token)
            ->postJson("/api/v1/accounts/{$account->id}/import-csv", $payload)
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.idempotent_replay', true)
            ->assertJsonPath('data.batch_uuid', $firstBatchUuid);

        $this->assertSame(1, TradeImportBatch::where('account_id', $account->id)->count());
        $this->assertSame(1, Trade::where('account_id', $account->id)->count());
    }
}
