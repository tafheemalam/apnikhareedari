<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartBasketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'basket_id' => $this->basket_id,
            'name' => $this->basket_name,
            'amount' => $this->amount,
            'filled_amount' => $this->filled_amount,
            'remaining_amount' => $this->remaining_amount,
            'items' => CartBasketItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
