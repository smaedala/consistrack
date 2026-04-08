<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiErrorContractTest extends TestCase
{
    use RefreshDatabase;

    public function test_validation_errors_follow_standard_contract(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token', ['*'])->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/v1/accounts', [
                // missing required fields
            ])
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Validation failed.')
            ->assertJsonPath('error.type', 'validation_error')
            ->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonPath('error.status', 422)
            ->assertJsonStructure([
                'error' => ['details'],
            ]);
    }

    public function test_unauthenticated_errors_follow_standard_contract(): void
    {
        $this->getJson('/api/v1/accounts')
            ->assertStatus(401)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Authentication required.')
            ->assertJsonPath('error.type', 'authentication_error')
            ->assertJsonPath('error.code', 'UNAUTHENTICATED')
            ->assertJsonPath('error.status', 401);
    }

    public function test_not_found_errors_follow_standard_contract(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token', ['*'])->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/v1/accounts/999999/dashboard/summary')
            ->assertStatus(404)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Resource not found.')
            ->assertJsonPath('error.type', 'not_found_error')
            ->assertJsonPath('error.code', 'NOT_FOUND')
            ->assertJsonPath('error.status', 404);
    }
}
