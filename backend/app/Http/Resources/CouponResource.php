<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CouponResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'type' => $this->type,
            'value' => $this->value,
            'minimum_order_amount' => $this->minimum_order_amount,
            'maximum_discount_amount' => $this->maximum_discount_amount,
            'usage_limit' => $this->usage_limit,
            'used_count' => $this->used_count,
            'status' => (bool) $this->status,
            'expires_at' => $this->expires_at,
            'created_at' => $this->created_at,
        ];
    }
}
