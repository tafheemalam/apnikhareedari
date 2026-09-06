<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'name' => $this->name,
            'slug' => $this->slug,
            'sku' => $this->sku,
            'barcode' => $this->barcode,
            'short_description' => $this->short_description,
            'description' => $this->description,
            'specifications' => $this->specifications,
            'price' => $this->price,
            'sale_price' => $this->sale_price,
            'cost_price' => $this->when($request->routeIs('admin.*'), $this->cost_price),
            'current_price' => $this->current_price,
            'is_on_sale' => $this->is_on_sale,
            'has_variations' => (bool) $this->has_variations,
            'status' => (bool) $this->status,
            'featured' => (bool) $this->featured,
            'new_arrival' => (bool) $this->new_arrival,
            'best_seller' => (bool) $this->best_seller,
            'show_in_basket' => (bool) $this->show_in_basket,
            'stock_quantity' => $this->stock_quantity,
            'in_stock' => $this->in_stock,
            'average_rating' => $this->whenAggregated('reviews', 'rating', 'avg', fn ($value) => round((float) $value, 1)),
            'reviews_count' => $this->whenCounted('reviews'),
            'images' => ProductImageResource::collection($this->whenLoaded('images')),
            'primary_image_url' => $this->whenLoaded('images', function () {
                $primary = $this->images->firstWhere('is_primary', true) ?? $this->images->first();

                return $primary ? asset('storage/'.$primary->image) : null;
            }),
            'variations' => ProductVariationResource::collection($this->whenLoaded('variations')),
            'created_at' => $this->created_at,
        ];
    }
}
