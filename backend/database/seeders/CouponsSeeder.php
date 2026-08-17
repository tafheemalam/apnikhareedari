<?php

namespace Database\Seeders;

use App\Models\Coupon;
use Illuminate\Database\Seeder;

class CouponsSeeder extends Seeder
{
    public function run(): void
    {
        $coupons = [
            ['code' => 'WELCOME10', 'type' => 'percentage', 'value' => 10, 'minimum_order_amount' => 1000, 'maximum_discount_amount' => 1000, 'usage_limit' => 500],
            ['code' => 'FLAT500', 'type' => 'fixed', 'value' => 500, 'minimum_order_amount' => 3000, 'maximum_discount_amount' => null, 'usage_limit' => 200],
            ['code' => 'EID25', 'type' => 'percentage', 'value' => 25, 'minimum_order_amount' => 5000, 'maximum_discount_amount' => 3000, 'usage_limit' => 100, 'expires_at' => now()->addMonths(2)],
        ];

        foreach ($coupons as $coupon) {
            Coupon::firstOrCreate(
                ['code' => $coupon['code']],
                array_merge(['status' => true, 'used_count' => 0], $coupon)
            );
        }
    }
}
