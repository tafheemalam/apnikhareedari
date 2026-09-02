<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registering_sends_a_verification_email(): void
    {
        Notification::fake();

        $this->postJson('/api/auth/register', [
            'name' => 'Ayesha Khan',
            'email' => 'ayesha@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])->assertCreated();

        $user = User::where('email', 'ayesha@example.com')->first();
        $this->assertNull($user->email_verified_at);
        Notification::assertSentTo($user, VerifyEmailNotification::class);
    }

    public function test_a_valid_signed_link_verifies_the_email(): void
    {
        $user = User::factory()->unverified()->create();

        $signedUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1($user->email)]
        );

        $response = $this->getJson(parse_url($signedUrl, PHP_URL_PATH).'?'.parse_url($signedUrl, PHP_URL_QUERY));

        $response->assertOk()->assertJsonPath('success', true);
        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_a_tampered_hash_is_rejected(): void
    {
        $user = User::factory()->unverified()->create();

        $signedUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => 'wrong-hash']
        );

        $response = $this->getJson(parse_url($signedUrl, PHP_URL_PATH).'?'.parse_url($signedUrl, PHP_URL_QUERY));

        $response->assertStatus(403);
        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_an_expired_link_is_rejected(): void
    {
        $user = User::factory()->unverified()->create();

        $signedUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->subMinutes(5),
            ['id' => $user->id, 'hash' => sha1($user->email)]
        );

        $response = $this->getJson(parse_url($signedUrl, PHP_URL_PATH).'?'.parse_url($signedUrl, PHP_URL_QUERY));

        $response->assertStatus(403);
    }

    public function test_unverified_customer_cannot_checkout(): void
    {
        $customer = User::factory()->unverified()->create();
        $product = $this->createProductWithStock(10);

        $this->actingAs($customer)->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 1]);

        $response = $this->actingAs($customer)->postJson('/api/checkout', [
            'shipping_full_name' => $customer->name,
            'shipping_phone' => '03001234567',
            'shipping_address' => 'House 1',
            'shipping_city' => 'Karachi',
            'payment_method' => 'cod',
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseCount('orders', 0);
    }

    public function test_verified_customer_can_checkout(): void
    {
        Notification::fake();
        $customer = User::factory()->create(); // verified by default
        $product = $this->createProductWithStock(10);

        $this->actingAs($customer)->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 1]);

        $response = $this->actingAs($customer)->postJson('/api/checkout', [
            'shipping_full_name' => $customer->name,
            'shipping_phone' => '03001234567',
            'shipping_address' => 'House 1',
            'shipping_city' => 'Karachi',
            'payment_method' => 'cod',
        ]);

        $response->assertCreated();
    }

    public function test_resend_verification_email(): void
    {
        Notification::fake();
        $customer = User::factory()->unverified()->create();

        $response = $this->actingAs($customer)->postJson('/api/auth/email/resend');

        $response->assertOk();
        Notification::assertSentTo($customer, VerifyEmailNotification::class);
    }

    public function test_resend_is_a_no_op_when_already_verified(): void
    {
        Notification::fake();
        $customer = User::factory()->create();

        $response = $this->actingAs($customer)->postJson('/api/auth/email/resend');

        $response->assertOk()->assertJsonPath('message', 'Email already verified');
        Notification::assertNotSentTo($customer, VerifyEmailNotification::class);
    }

    public function test_registration_does_not_return_an_auth_token(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Ayesha Khan',
            'email' => 'ayesha@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertCreated()->assertJsonMissingPath('data.token');

        $user = User::where('email', 'ayesha@example.com')->first();
        $this->assertEquals(0, $user->tokens()->count());
    }

    public function test_a_guest_can_resend_the_verification_email_by_address(): void
    {
        Notification::fake();
        $customer = User::factory()->unverified()->create();

        $response = $this->postJson('/api/auth/email/resend-guest', ['email' => $customer->email]);

        $response->assertOk();
        Notification::assertSentTo($customer, VerifyEmailNotification::class);
    }

    public function test_resend_by_address_returns_a_generic_success_for_an_unknown_email(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/auth/email/resend-guest', ['email' => 'nobody@example.com']);

        $response->assertOk();
        Notification::assertNothingSent();
    }
}
