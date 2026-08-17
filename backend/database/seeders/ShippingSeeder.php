<?php

namespace Database\Seeders;

use App\Models\ShippingZone;
use Illuminate\Database\Seeder;

class ShippingSeeder extends Seeder
{
    public const ZONES = [
        ['name' => 'Karachi', 'rate' => 200, 'free_shipping_threshold' => 3000, 'min' => 1, 'max' => 2],
        ['name' => 'Lahore', 'rate' => 250, 'free_shipping_threshold' => 3000, 'min' => 2, 'max' => 4],
        ['name' => 'Islamabad', 'rate' => 250, 'free_shipping_threshold' => 3000, 'min' => 2, 'max' => 4],
        ['name' => 'Other Cities', 'rate' => 350, 'free_shipping_threshold' => 5000, 'min' => 3, 'max' => 6],
    ];

    public function run(): void
    {
        foreach (self::ZONES as $zone) {
            $shippingZone = ShippingZone::firstOrCreate(['name' => $zone['name']], ['status' => true]);

            $shippingZone->rates()->firstOrCreate([], [
                'rate' => $zone['rate'],
                'free_shipping_threshold' => $zone['free_shipping_threshold'],
                'estimated_delivery_days_min' => $zone['min'],
                'estimated_delivery_days_max' => $zone['max'],
            ]);
        }
    }
}
