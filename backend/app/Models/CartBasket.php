<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CartBasket extends Model
{
    protected $fillable = [
        'cart_id',
        'basket_id',
        'basket_name',
        'amount',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    public function cart(): BelongsTo
    {
        return $this->belongsTo(Cart::class);
    }

    public function basket(): BelongsTo
    {
        return $this->belongsTo(Basket::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(CartBasketItem::class);
    }

    public function getFilledAmountAttribute(): float
    {
        return (float) $this->items->sum(fn (CartBasketItem $item) => $item->quantity * (float) $item->unit_price);
    }

    public function getRemainingAmountAttribute(): float
    {
        return round((float) $this->amount - $this->filled_amount, 2);
    }
}
