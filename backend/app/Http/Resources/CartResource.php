<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'cart_token' => $this->session_token,
            'items' => CartItemResource::collection($this->whenLoaded('items')),
            'items_count' => $this->whenLoaded('items', fn () => $this->items->sum('quantity')),
            'basket_instances' => CartBasketResource::collection($this->whenLoaded('basketInstances')),
            'basket_instances_count' => $this->whenLoaded('basketInstances', fn () => $this->basketInstances->count()),
            'subtotal' => $this->subtotal,
        ];
    }
}
