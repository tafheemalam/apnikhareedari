<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\ShippingZone;

class ShippingService
{
    public function calculate(string $city, float $subtotal): array
    {
        $zone = ShippingZone::active()
            ->where('name', 'like', trim($city))
            ->with('rates')
            ->first();

        if (! $zone) {
            $zone = ShippingZone::active()->where('name', 'Other Cities')->with('rates')->first();
        }

        $rate = $zone?->rates?->first();

        if (! $rate) {
            $defaultRate = (float) Setting::get('shipping.default_rate', 250);
            $freeThreshold = (float) Setting::get('shipping.free_shipping_threshold', 5000);

            return [
                'zone' => $zone?->name ?? 'Standard',
                'amount' => $subtotal >= $freeThreshold ? 0.0 : $defaultRate,
                'estimated_days' => null,
            ];
        }

        $isFree = $rate->free_shipping_threshold !== null && $subtotal >= (float) $rate->free_shipping_threshold;

        return [
            'zone' => $zone->name,
            'amount' => $isFree ? 0.0 : (float) $rate->rate,
            'estimated_days' => $rate->estimated_delivery_days_min
                ? "{$rate->estimated_delivery_days_min}-{$rate->estimated_delivery_days_max} days"
                : null,
        ];
    }
}
