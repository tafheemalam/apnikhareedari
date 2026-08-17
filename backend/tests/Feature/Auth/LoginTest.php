<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_user_can_login_with_correct_credentials(): void
    {
        User::factory()->create([
            'email' => 'ayesha@example.com',
            'password' => bcrypt('Password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'ayesha@example.com',
            'password' => 'Password123',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['user', 'token']]);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        User::factory()->create([
            'email' => 'ayesha@example.com',
            'password' => bcrypt('Password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'ayesha@example.com',
            'password' => 'WrongPassword',
        ]);

        $response->assertStatus(401)->assertJsonPath('success', false);
    }

    public function test_deactivated_users_cannot_login(): void
    {
        User::factory()->create([
            'email' => 'ayesha@example.com',
            'password' => bcrypt('Password123'),
            'is_active' => false,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'ayesha@example.com',
            'password' => 'Password123',
        ]);

        $response->assertStatus(403)->assertJsonPath('success', false);
    }
}
