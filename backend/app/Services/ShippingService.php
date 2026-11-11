<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\ShippingZone;

class ShippingService
{
    /**
     * Shipping cost is weight-based and the same nationwide — zones are only
     * used here for the free-shipping threshold and the delivery time estimate.
     */
    public function calculate(string $city, float $subtotal, float $weightKg = 1.0): array
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
            $freeThreshold = (float) Setting::get('shipping.free_shipping_threshold', 5000);

            return [
                'zone' => $zone?->name ?? 'Standard',
                'amount' => $subtotal >= $freeThreshold ? 0.0 : $this->weightBasedRate($weightKg),
                'estimated_days' => null,
            ];
        }

        $isFree = $rate->free_shipping_threshold !== null && $subtotal >= (float) $rate->free_shipping_threshold;

        return [
            'zone' => $zone->name,
            'amount' => $isFree ? 0.0 : $this->weightBasedRate($weightKg),
            'estimated_days' => $rate->estimated_delivery_days_min
                ? "{$rate->estimated_delivery_days_min}-{$rate->estimated_delivery_days_max} days"
                : null,
        ];
    }

    public function weightBasedRate(float $weightKg): float
    {
        $baseRate = (float) Setting::get('shipping.weight_base_rate', 300);
        $incrementRate = (float) Setting::get('shipping.weight_increment_rate', 150);
        $billableKg = max(1, (int) ceil($weightKg));

        return $baseRate + $incrementRate * ($billableKg - 1);
    }
}
