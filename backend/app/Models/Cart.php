<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cart extends Model
{
    protected $fillable = [
        'user_id',
        'session_token',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    public function basketInstances(): HasMany
    {
        return $this->hasMany(CartBasket::class);
    }

    public function getSubtotalAttribute(): float
    {
        $itemsTotal = (float) $this->items->sum(fn (CartItem $item) => $item->quantity * (float) $item->unit_price);
        $basketsTotal = (float) $this->basketInstances->sum(fn (CartBasket $cartBasket) => (float) $cartBasket->amount);

        return $itemsTotal + $basketsTotal;
    }
}
