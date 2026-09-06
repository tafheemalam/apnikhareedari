<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Concerns\ResolvesCart;
use App\Http\Requests\Cart\AddCartBasketItemRequest;
use App\Http\Requests\Cart\StoreCartBasketRequest;
use App\Http\Resources\CartResource;
use App\Models\Basket;
use App\Models\CartBasket;
use App\Models\CartBasketItem;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Services\BasketService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class CartBasketController extends Controller
{
    use ResolvesCart;

    protected const EAGER_LOADS = [
        'items.product.images', 'items.product.inventory', 'items.variation.inventory', 'items.variation.options',
        'basketInstances.items.product.images', 'basketInstances.items.product.inventory',
        'basketInstances.items.variation.inventory', 'basketInstances.items.variation.options',
    ];

    public function __construct(protected BasketService $basketService) {}

    public function store(StoreCartBasketRequest $request): JsonResponse
    {
        $cart = $this->resolveCart($request);
        $basket = Basket::findOrFail($request->validated('basket_id'));

        try {
            $this->basketService->startInstance($cart, $basket);
        } catch (RuntimeException $e) {
            return $this->error($e->getMessage(), null, 422);
        }

        $cart->load(self::EAGER_LOADS);

        return $this->success(new CartResource($cart), 'Basket started');
    }

    public function addItem(AddCartBasketItemRequest $request, CartBasket $cartBasket): JsonResponse
    {
        $cart = $this->resolveCart($request);
        abort_unless($cartBasket->cart_id === $cart->id, 404);

        $product = Product::findOrFail($request->validated('product_id'));
        $variation = $request->validated('product_variation_id')
            ? ProductVariation::where('product_id', $product->id)->findOrFail($request->validated('product_variation_id'))
            : null;

        try {
            $this->basketService->addItem($cartBasket, $product, $variation, $request->validated('quantity'));
        } catch (RuntimeException $e) {
            return $this->error($e->getMessage(), null, 422);
        }

        $cart->load(self::EAGER_LOADS);

        return $this->success(new CartResource($cart), 'Item added to basket');
    }

    public function removeItem(Request $request, CartBasket $cartBasket, CartBasketItem $cartBasketItem): JsonResponse
    {
        $cart = $this->resolveCart($request);
        abort_unless($cartBasket->cart_id === $cart->id, 404);
        abort_unless($cartBasketItem->cart_basket_id === $cartBasket->id, 404);

        $this->basketService->removeItem($cartBasketItem);

        $cart->load(self::EAGER_LOADS);

        return $this->success(new CartResource($cart), 'Item removed from basket');
    }

    public function destroy(Request $request, CartBasket $cartBasket): JsonResponse
    {
        $cart = $this->resolveCart($request);
        abort_unless($cartBasket->cart_id === $cart->id, 404);

        $this->basketService->removeInstance($cartBasket);

        $cart->load(self::EAGER_LOADS);

        return $this->success(new CartResource($cart), 'Basket removed');
    }
}
