<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            'store' => [
                'store.name' => 'ApniKhareedari',
                'store.logo' => null,
                'store.favicon' => null,
                'store.email' => 'support@apnikhareedari.pk',
                'store.phone' => '+92 300 1234567',
                'store.address' => 'Shahrah-e-Faisal, Karachi, Pakistan',
            ],
            'payment' => [
                'payment.cod_enabled' => '1',
                'payment.online_enabled' => '1',
                'payment.active_gateway' => 'mock',
            ],
            'shipping' => [
                'shipping.default_rate' => '250',
                'shipping.free_shipping_threshold' => '5000',
            ],
            'tax' => [
                'tax.enabled' => '0',
                'tax.percentage' => '0',
            ],
            'email' => [
                'mail.from_address' => 'noreply@apnikhareedari.pk',
                'mail.from_name' => 'ApniKhareedari',
            ],
            'social' => [
                'social.facebook' => null,
                'social.instagram' => null,
                'social.tiktok' => null,
                'social.youtube' => null,
            ],
        ];

        foreach ($defaults as $group => $settings) {
            foreach ($settings as $key => $value) {
                Setting::firstOrCreate(['key' => $key], ['value' => $value, 'group' => $group]);
            }
        }
    }
}
