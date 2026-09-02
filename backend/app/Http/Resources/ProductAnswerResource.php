<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductAnswerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'answer' => $this->answer,
            'customer_name' => $this->whenLoaded('user', fn () => $this->user->name),
            'is_seller_answer' => $this->is_seller_answer,
            'created_at' => $this->created_at,
        ];
    }
}
