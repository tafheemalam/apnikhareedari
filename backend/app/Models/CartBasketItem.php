<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CartBasketItem extends Model
{
    protected $fillable = [
        'cart_basket_id',
        'product_id',
        'product_variation_id',
        'quantity',
    ];

    public function cartBasket(): BelongsTo
    {
        return $this->belongsTo(CartBasket::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variation(): BelongsTo
    {
        return $this->belongsTo(ProductVariation::class, 'product_variation_id');
    }

    public function getUnitPriceAttribute(): string
    {
        return $this->variation?->current_price ?? $this->product->current_price;
    }

    public function getLineTotalAttribute(): float
    {
        return (float) $this->unit_price * $this->quantity;
    }
}
