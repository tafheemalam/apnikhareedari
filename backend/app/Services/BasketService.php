<?php

namespace App\Services;

use App\Models\Basket;
use App\Models\Cart;
use App\Models\CartBasket;
use App\Models\CartBasketItem;
use App\Models\Product;
use App\Models\ProductVariation;
use RuntimeException;

class BasketService
{
    public function __construct(protected InventoryService $inventoryService) {}

    public function startInstance(Cart $cart, Basket $basket): CartBasket
    {
        if (! $basket->status) {
            throw new RuntimeException('This basket is no longer available.');
        }

        return $cart->basketInstances()->create([
            'basket_id' => $basket->id,
            'basket_name' => $basket->name,
            'amount' => $basket->amount,
        ]);
    }

    public function addItem(CartBasket $cartBasket, Product $product, ?ProductVariation $variation, int $quantity): CartBasketItem
    {
        if (! $product->status) {
            throw new RuntimeException('This product is not available.');
        }

        $existing = $cartBasket->items()
            ->where('product_id', $product->id)
            ->where('product_variation_id', $variation?->id)
            ->first();

        $newQuantity = ($existing?->quantity ?? 0) + $quantity;

        if (! $this->inventoryService->hasAvailableStock($product, $variation, $newQuantity)) {
            throw new RuntimeException('Requested quantity is not available in stock.');
        }

        $unitPrice = (float) ($variation?->current_price ?? $product->current_price);
        $otherItemsTotal = (float) $cartBasket->items
            ->where('id', '!=', $existing?->id)
            ->sum(fn (CartBasketItem $item) => $item->quantity * (float) $item->unit_price);
        $projected = $otherItemsTotal + ($newQuantity * $unitPrice);

        if ($projected > (float) $cartBasket->amount + 0.001) {
            $remaining = round((float) $cartBasket->amount - $otherItemsTotal, 2);
            throw new RuntimeException("Adding this item would exceed the basket's Rs. {$cartBasket->amount} budget (Rs. {$remaining} remaining).");
        }

        if ($existing) {
            $existing->update(['quantity' => $newQuantity]);

            return $existing;
        }

        return $cartBasket->items()->create([
            'product_id' => $product->id,
            'product_variation_id' => $variation?->id,
            'quantity' => $quantity,
        ]);
    }

    public function removeItem(CartBasketItem $item): void
    {
        $item->delete();
    }

    public function removeInstance(CartBasket $cartBasket): void
    {
        $cartBasket->delete();
    }

    /**
     * Re-validated at checkout time — throws on an empty basket, budget drift (e.g. a contained
     * product's price rose after it was added), or insufficient stock.
     */
    public function assertFillIsValid(CartBasket $cartBasket): void
    {
        if ($cartBasket->items->isEmpty()) {
            throw new RuntimeException("Your \"{$cartBasket->basket_name}\" basket is empty. Add items or remove it before checkout.");
        }

        if ($cartBasket->filled_amount > (float) $cartBasket->amount + 0.001) {
            throw new RuntimeException("Items in your \"{$cartBasket->basket_name}\" basket now exceed its Rs. {$cartBasket->amount} budget due to a price change. Please review it.");
        }

        foreach ($cartBasket->items as $item) {
            if (! $this->inventoryService->hasAvailableStock($item->product, $item->variation, $item->quantity)) {
                throw new RuntimeException("\"{$item->product->name}\" in your \"{$cartBasket->basket_name}\" basket no longer has enough stock available.");
            }
        }
    }
}
