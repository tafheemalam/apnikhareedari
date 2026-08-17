<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'customer' => $this->whenLoaded('user', fn () => $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ] : null),
            'status' => $this->status,
            'payment_method' => $this->payment_method,
            'payment_status' => $this->payment_status,
            'is_cancellable' => $this->isCancellable(),
            'subtotal' => $this->subtotal,
            'discount_amount' => $this->discount_amount,
            'shipping_amount' => $this->shipping_amount,
            'tax_amount' => $this->tax_amount,
            'total' => $this->total,
            'shipping' => [
                'full_name' => $this->shipping_full_name,
                'phone' => $this->shipping_phone,
                'email' => $this->shipping_email,
                'address' => $this->shipping_address,
                'city' => $this->shipping_city,
                'area' => $this->shipping_area,
                'postal_code' => $this->shipping_postal_code,
            ],
            'billing_same_as_shipping' => (bool) $this->billing_same_as_shipping,
            'billing' => $this->billing_same_as_shipping ? null : [
                'full_name' => $this->billing_full_name,
                'phone' => $this->billing_phone,
                'address' => $this->billing_address,
                'city' => $this->billing_city,
                'area' => $this->billing_area,
                'postal_code' => $this->billing_postal_code,
            ],
            'delivery_notes' => $this->delivery_notes,
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'payments' => PaymentResource::collection($this->whenLoaded('payments')),
            'placed_at' => $this->placed_at,
            'cancelled_at' => $this->cancelled_at,
        ];
    }
}
