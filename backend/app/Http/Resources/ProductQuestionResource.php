<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductQuestionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product' => $this->whenLoaded('product', fn () => [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'slug' => $this->product->slug,
            ]),
            'customer_name' => $this->whenLoaded('user', fn () => $this->user->name),
            'question' => $this->question,
            'status' => $this->status,
            'answers' => ProductAnswerResource::collection($this->whenLoaded('answers')),
            'created_at' => $this->created_at,
        ];
    }
}
