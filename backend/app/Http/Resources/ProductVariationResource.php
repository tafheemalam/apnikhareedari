<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductVariationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sku' => $this->sku,
            'price' => $this->price,
            'sale_price' => $this->sale_price,
            'current_price' => $this->current_price,
            'image_url' => $this->image ? asset('storage/'.$this->image) : null,
            'status' => (bool) $this->status,
            'label' => $this->label,
            'options' => $this->options->map(fn ($o) => [
                'attribute_name' => $o->attribute_name,
                'attribute_value' => $o->attribute_value,
            ]),
            'stock_quantity' => $this->whenLoaded('inventory', fn () => $this->inventory?->quantity ?? 0),
            'low_stock_threshold' => $this->whenLoaded('inventory', fn () => $this->inventory?->low_stock_threshold),
        ];
    }
}
