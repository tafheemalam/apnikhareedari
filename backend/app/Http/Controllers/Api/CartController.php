<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Concerns\ResolvesCart;
use App\Http\Requests\Cart\AddCartItemRequest;
use App\Http\Resources\CartResource;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class CartController extends Controller
{
    use ResolvesCart;

    protected const EAGER_LOADS = [
        'items.product.images', 'items.product.inventory', 'items.variation.inventory', 'items.variation.options',
        'basketInstances.items.product.images', 'basketInstances.items.product.inventory',
        'basketInstances.items.variation.inventory', 'basketInstances.items.variation.options',
    ];

    public function __construct(protected CartService $cartService) {}

    public function show(Request $request): JsonResponse
    {
        $cart = $this->resolveCart($request);
        $cart->load(self::EAGER_LOADS);

        return $this->success(new CartResource($cart));
    }

    public function addItem(AddCartItemRequest $request): JsonResponse
    {
        $cart = $this->resolveCart($request);
        $product = Product::findOrFail($request->validated('product_id'));
        $variation = $request->validated('product_variation_id')
            ? ProductVariation::where('product_id', $product->id)->findOrFail($request->validated('product_variation_id'))
            : null;

        try {
            $this->cartService->addItem($cart, $product, $variation, $request->validated('quantity'));
        } catch (RuntimeException $e) {
            return $this->error($e->getMessage(), null, 422);
        }

        $cart->load(self::EAGER_LOADS);

        return $this->success(new CartResource($cart), 'Item added to cart');
    }

    public function updateItem(Request $request, CartItem $item): JsonResponse
    {
        $cart = $this->resolveCart($request);
        abort_unless($item->cart_id === $cart->id, 404);

        $request->validate(['quantity' => ['required', 'integer', 'min:1']]);

        try {
            $this->cartService->updateItemQuantity($item, $request->integer('quantity'));
        } catch (RuntimeException $e) {
            return $this->error($e->getMessage(), null, 422);
        }

        $cart->load(self::EAGER_LOADS);

        return $this->success(new CartResource($cart), 'Cart updated');
    }

    public function removeItem(Request $request, CartItem $item): JsonResponse
    {
        $cart = $this->resolveCart($request);
        abort_unless($item->cart_id === $cart->id, 404);

        $item->delete();
        $cart->load(self::EAGER_LOADS);

        return $this->success(new CartResource($cart), 'Item removed from cart');
    }

    public function clear(Request $request): JsonResponse
    {
        $cart = $this->resolveCart($request);
        $cart->items()->delete();
        $cart->basketInstances()->delete();

        $cart->load(self::EAGER_LOADS);

        return $this->success(new CartResource($cart), 'Cart cleared');
    }
}
