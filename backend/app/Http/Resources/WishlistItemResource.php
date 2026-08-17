<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WishlistItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $product = $this->product;
        $image = $product->images->firstWhere('is_primary', true) ?? $product->images->first();

        return [
            'id' => $this->id,
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'current_price' => $product->current_price,
                'in_stock' => $product->in_stock,
                'image_url' => $image ? asset('storage/'.$image->image) : null,
            ],
            'added_at' => $this->created_at,
        ];
    }
}
