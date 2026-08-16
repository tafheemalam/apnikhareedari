<?php

namespace Database\Seeders;

use App\Models\Cart;
use App\Models\User;
use App\Models\Wishlist;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => env('ADMIN_SEED_EMAIL', 'admin@apnikhareedari.pk')],
            [
                'name' => 'Store Admin',
                'password' => env('ADMIN_SEED_PASSWORD', 'Admin@12345'),
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
        $admin->syncRoles(['Super Admin']);

        $customer = User::firstOrCreate(
            ['email' => env('CUSTOMER_SEED_EMAIL', 'customer@apnikhareedari.pk')],
            [
                'name' => 'Demo Customer',
                'password' => env('CUSTOMER_SEED_PASSWORD', 'Customer@12345'),
                'phone' => '03001234567',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        Cart::firstOrCreate(['user_id' => $customer->id]);
        Wishlist::firstOrCreate(['user_id' => $customer->id]);
        Cart::firstOrCreate(['user_id' => $admin->id]);
    }
}
