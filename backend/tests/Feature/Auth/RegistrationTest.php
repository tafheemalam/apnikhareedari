<?php

namespace Tests\Feature\Auth;

use App\Models\Cart;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_customer_can_register(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Ayesha Khan',
            'email' => 'ayesha@example.com',
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.email', 'ayesha@example.com')
            ->assertJsonStructure(['data' => ['user', 'token']]);

        $this->assertDatabaseHas('users', ['email' => 'ayesha@example.com']);

        $user = User::where('email', 'ayesha@example.com')->first();
        $this->assertTrue($user->is_active);
        $this->assertNotNull(Cart::where('user_id', $user->id)->first());
    }

    public function test_registration_requires_matching_password_confirmation(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Ayesha Khan',
            'email' => 'ayesha@example.com',
            'password' => 'Password123',
            'password_confirmation' => 'Different123',
        ]);

        $response->assertStatus(422)->assertJsonPath('success', false);
        $this->assertDatabaseMissing('users', ['email' => 'ayesha@example.com']);
    }

    public function test_registration_rejects_duplicate_email(): void
    {
        User::factory()->create(['email' => 'ayesha@example.com']);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Ayesha Khan',
            'email' => 'ayesha@example.com',
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
        ]);

        $response->assertStatus(422)->assertJsonPath('success', false);
    }
}
