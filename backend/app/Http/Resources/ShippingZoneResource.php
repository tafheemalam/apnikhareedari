<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShippingZoneResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $rate = $this->rates->first();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'status' => (bool) $this->status,
            'rate' => $rate?->rate,
            'free_shipping_threshold' => $rate?->free_shipping_threshold,
            'estimated_delivery_days_min' => $rate?->estimated_delivery_days_min,
            'estimated_delivery_days_max' => $rate?->estimated_delivery_days_max,
        ];
    }
}
