<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $defaults = [
            'payment.jazzcash_enabled' => '0',
            'payment.easypaisa_enabled' => '0',
            'payment.mobile_payment_number' => null,
            'payment.account_title' => null,
            'payment.whatsapp_number' => null,
        ];

        foreach ($defaults as $key => $value) {
            if (! DB::table('settings')->where('key', $key)->exists()) {
                DB::table('settings')->insert([
                    'key' => $key,
                    'value' => $value,
                    'group' => 'payment',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        DB::table('settings')->whereIn('key', [
            'payment.jazzcash_enabled',
            'payment.easypaisa_enabled',
            'payment.mobile_payment_number',
            'payment.account_title',
            'payment.whatsapp_number',
        ])->delete();
    }
};
