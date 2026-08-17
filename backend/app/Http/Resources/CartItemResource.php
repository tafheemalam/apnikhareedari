<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $image = $this->product->images->firstWhere('is_primary', true) ?? $this->product->images->first();

        return [
            'id' => $this->id,
            'product' => [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'slug' => $this->product->slug,
                'sku' => $this->variation?->sku ?? $this->product->sku,
                'image_url' => $image ? asset('storage/'.$image->image) : null,
            ],
            'variation' => $this->variation ? [
                'id' => $this->variation->id,
                'label' => $this->variation->label,
            ] : null,
            'quantity' => $this->quantity,
            'unit_price' => $this->unit_price,
            'line_total' => $this->line_total,
            'available_stock' => $this->variation?->inventory?->quantity ?? $this->product->inventory?->quantity ?? 0,
        ];
    }
}
