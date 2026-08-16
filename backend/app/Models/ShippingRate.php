<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShippingRate extends Model
{
    protected $fillable = [
        'shipping_zone_id',
        'rate',
        'free_shipping_threshold',
        'estimated_delivery_days_min',
        'estimated_delivery_days_max',
    ];

    protected function casts(): array
    {
        return [
            'rate' => 'decimal:2',
            'free_shipping_threshold' => 'decimal:2',
        ];
    }

    public function zone(): BelongsTo
    {
        return $this->belongsTo(ShippingZone::class, 'shipping_zone_id');
    }
}
