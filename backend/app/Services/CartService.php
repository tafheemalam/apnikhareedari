<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartBasket;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\User;
use Illuminate\Support\Str;
use RuntimeException;

class CartService
{
    public function __construct(protected InventoryService $inventoryService) {}

    public function resolveForUser(User $user): Cart
    {
        return Cart::firstOrCreate(['user_id' => $user->id]);
    }

    public function resolveForGuest(?string $sessionToken): Cart
    {
        if ($sessionToken) {
            return Cart::firstOrCreate(['session_token' => $sessionToken]);
        }

        return Cart::create(['session_token' => (string) Str::uuid()]);
    }

    /**
     * Merge a guest cart into the just-authenticated user's cart, then discard the guest cart.
     */
    public function mergeGuestCartIntoUser(?string $guestToken, User $user): void
    {
        if (! $guestToken) {
            return;
        }

        $guestCart = Cart::where('session_token', $guestToken)->with('items')->first();

        if (! $guestCart) {
            return;
        }

        $userCart = $this->resolveForUser($user);

        foreach ($guestCart->items as $guestItem) {
            $existing = $userCart->items()
                ->where('product_id', $guestItem->product_id)
                ->where('product_variation_id', $guestItem->product_variation_id)
                ->first();

            if ($existing) {
                $existing->update(['quantity' => $existing->quantity + $guestItem->quantity]);
            } else {
                $userCart->items()->create([
                    'product_id' => $guestItem->product_id,
                    'product_variation_id' => $guestItem->product_variation_id,
                    'quantity' => $guestItem->quantity,
                ]);
            }
        }

        // Basket instances are never merge-collapsed (they have no natural dedup key) — just
        // re-parent them to the user's cart before the guest cart row is discarded.
        CartBasket::where('cart_id', $guestCart->id)->update(['cart_id' => $userCart->id]);

        $guestCart->delete();
    }

    public function addItem(Cart $cart, Product $product, ?ProductVariation $variation, int $quantity, ?string $note = null): CartItem
    {
        if (! $this->inventoryService->hasAvailableStock($product, $variation, $quantity)) {
            throw new RuntimeException('Requested quantity is not available in stock.');
        }

        $item = $cart->items()
            ->where('product_id', $product->id)
            ->where('product_variation_id', $variation?->id)
            ->first();

        $newQuantity = ($item?->quantity ?? 0) + $quantity;

        if (! $this->inventoryService->hasAvailableStock($product, $variation, $newQuantity)) {
            throw new RuntimeException('Requested quantity is not available in stock.');
        }

        if ($item) {
            // Adding the same product again (e.g. bumping quantity from the
            // listing page) shouldn't silently wipe out a note already left
            // on this line — only overwrite it when a new one is actually given.
            $item->update(array_filter([
                'quantity' => $newQuantity,
                'note' => $note,
            ], fn ($value, $key) => $key === 'quantity' || $value !== null, ARRAY_FILTER_USE_BOTH));

            return $item;
        }

        return $cart->items()->create([
            'product_id' => $product->id,
            'product_variation_id' => $variation?->id,
            'quantity' => $quantity,
            'note' => $note,
        ]);
    }

    public function updateItemQuantity(CartItem $item, int $quantity, ?string $note = null, bool $noteProvided = false): CartItem
    {
        if (! $this->inventoryService->hasAvailableStock($item->product, $item->variation, $quantity)) {
            throw new RuntimeException('Requested quantity is not available in stock.');
        }

        $item->update($noteProvided ? ['quantity' => $quantity, 'note' => $note] : ['quantity' => $quantity]);

        return $item;
    }
}
