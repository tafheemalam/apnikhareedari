<?php

namespace Tests\Feature;

use App\Models\Coupon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CouponTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_valid_coupon_returns_the_correct_discount(): void
    {
        Coupon::create([
            'code' => 'FLAT500', 'type' => 'fixed', 'value' => 500,
            'minimum_order_amount' => 2000, 'status' => true, 'used_count' => 0,
        ]);

        $response = $this->postJson('/api/coupons/validate', ['code' => 'flat500', 'subtotal' => 3000]);

        $response->assertOk()->assertJsonPath('data.discount_amount', 500);
    }

    public function test_coupon_below_minimum_order_amount_is_rejected(): void
    {
        Coupon::create([
            'code' => 'FLAT500', 'type' => 'fixed', 'value' => 500,
            'minimum_order_amount' => 2000, 'status' => true, 'used_count' => 0,
        ]);

        $response = $this->postJson('/api/coupons/validate', ['code' => 'FLAT500', 'subtotal' => 1000]);

        $response->assertStatus(422)->assertJsonPath('success', false);
    }

    public function test_expired_coupon_is_rejected(): void
    {
        Coupon::create([
            'code' => 'OLD10', 'type' => 'percentage', 'value' => 10,
            'status' => true, 'used_count' => 0, 'expires_at' => now()->subDay(),
        ]);

        $response = $this->postJson('/api/coupons/validate', ['code' => 'OLD10', 'subtotal' => 3000]);

        $response->assertStatus(422)->assertJsonPath('success', false);
    }

    public function test_coupon_that_reached_its_usage_limit_is_rejected(): void
    {
        Coupon::create([
            'code' => 'LIMITED', 'type' => 'percentage', 'value' => 10,
            'status' => true, 'usage_limit' => 1, 'used_count' => 1,
        ]);

        $response = $this->postJson('/api/coupons/validate', ['code' => 'LIMITED', 'subtotal' => 3000]);

        $response->assertStatus(422)->assertJsonPath('success', false);
    }

    public function test_percentage_discount_is_capped_by_maximum_discount_amount(): void
    {
        Coupon::create([
            'code' => 'BIG50', 'type' => 'percentage', 'value' => 50,
            'maximum_discount_amount' => 300, 'status' => true, 'used_count' => 0,
        ]);

        $response = $this->postJson('/api/coupons/validate', ['code' => 'BIG50', 'subtotal' => 2000]);

        $response->assertOk()->assertJsonPath('data.discount_amount', 300);
    }

    public function test_nonexistent_coupon_returns_not_found(): void
    {
        $response = $this->postJson('/api/coupons/validate', ['code' => 'DOESNOTEXIST', 'subtotal' => 1000]);

        $response->assertStatus(404)->assertJsonPath('success', false);
    }
}
