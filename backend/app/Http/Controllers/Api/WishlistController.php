<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\WishlistItemResource;
use App\Models\Product;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class WishlistController extends Controller
{
    public function __construct(protected CartService $cartService) {}

    public function index(Request $request): JsonResponse
    {
        $wishlist = $request->user()->wishlist()->firstOrCreate([]);
        $wishlist->load('items.product.images', 'items.product.inventory');

        return $this->success(WishlistItemResource::collection($wishlist->items));
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate(['product_id' => ['required', 'integer', 'exists:products,id']]);

        $wishlist = $request->user()->wishlist()->firstOrCreate([]);
        $item = $wishlist->items()->firstOrCreate(['product_id' => $request->integer('product_id')]);
        $item->load('product.images', 'product.inventory');

        return $this->success(new WishlistItemResource($item), 'Product added to wishlist', 201);
    }

    public function destroy(Request $request, Product $product): JsonResponse
    {
        $wishlist = $request->user()->wishlist()->firstOrCreate([]);
        $wishlist->items()->where('product_id', $product->id)->delete();

        return $this->success(null, 'Product removed from wishlist');
    }

    public function moveToCart(Request $request, Product $product): JsonResponse
    {
        $wishlist = $request->user()->wishlist()->firstOrCreate([]);
        $cart = $this->cartService->resolveForUser($request->user());

        try {
            $this->cartService->addItem($cart, $product, null, 1);
        } catch (RuntimeException $e) {
            return $this->error($e->getMessage(), null, 422);
        }

        $wishlist->items()->where('product_id', $product->id)->delete();

        return $this->success(null, 'Product moved to cart');
    }
}
