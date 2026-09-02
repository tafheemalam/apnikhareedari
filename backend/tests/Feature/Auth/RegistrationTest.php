<?php

namespace Tests\Feature\Auth;

use App\Models\Cart;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use PHPUnit\Framework\Attributes\DataProvider;
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
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.email', 'ayesha@example.com')
            ->assertJsonPath('data.user.email_verified', false)
            ->assertJsonStructure(['data' => ['user']])
            ->assertJsonMissingPath('data.token');

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
            'password' => 'Password123!',
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
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertStatus(422)->assertJsonPath('success', false);
    }

    public function test_registration_rejects_malformed_email(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Ayesha Khan',
            'email' => 'not-an-email',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_registration_email_is_normalized_to_lowercase(): void
    {
        Notification::fake();

        $this->postJson('/api/auth/register', [
            'name' => 'Ayesha Khan',
            'email' => 'Ayesha@Example.COM',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])->assertCreated();

        $this->assertDatabaseHas('users', ['email' => 'ayesha@example.com']);
    }

    #[DataProvider('weakPasswords')]
    public function test_registration_rejects_weak_passwords(string $password): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Ayesha Khan',
            'email' => 'ayesha@example.com',
            'password' => $password,
            'password_confirmation' => $password,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('password');
    }

    public static function weakPasswords(): array
    {
        return [
            'too short' => ['Aa1!'],
            'no uppercase' => ['password123!'],
            'no lowercase' => ['PASSWORD123!'],
            'no number' => ['Password!!'],
            'no symbol' => ['Password123'],
        ];
    }

    public function test_registration_rejects_an_invalid_phone_number(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Ayesha Khan',
            'email' => 'ayesha@example.com',
            'phone' => '12345',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('phone');
    }

    #[DataProvider('validPakistaniPhoneFormats')]
    public function test_registration_accepts_valid_pakistani_phone_formats(string $phone): void
    {
        Notification::fake();

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Ayesha Khan',
            'email' => 'ayesha+'.crc32($phone).'@example.com',
            'phone' => $phone,
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertCreated();
    }

    public static function validPakistaniPhoneFormats(): array
    {
        return [
            'local 03XX format' => ['03001234567'],
            'with dashes' => ['0300-1234567'],
            'international +92' => ['+923001234567'],
            'international 0092' => ['00923001234567'],
        ];
    }
}
