<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_login_me_and_logout_flow(): void
    {
        $registerResponse = $this->postJson('/api/v1/auth/register', [
            'name' => 'Alex Trader',
            'email' => 'alex@example.com',
            'password' => 'password123',
        ]);

        $registerResponse
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.email', 'alex@example.com');

        $token = $registerResponse->json('data.token');
        $this->assertNotEmpty($token);

        $this->withToken($token)
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.email', 'alex@example.com');

        $this->withToken($token)
            ->postJson('/api/v1/auth/logout')
            ->assertOk()
            ->assertJsonPath('success', true);

        $user = User::where('email', 'alex@example.com')->firstOrFail();
        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->assertCount(0, $user->tokens()->get());
    }

    public function test_login_with_invalid_credentials_is_rejected(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'name' => 'Alex Trader',
            'email' => 'alex@example.com',
            'password' => 'password123',
        ])->assertCreated();

        $this->postJson('/api/v1/auth/login', [
            'email' => 'alex@example.com',
            'password' => 'wrong-password',
        ])->assertUnauthorized();
    }
}
