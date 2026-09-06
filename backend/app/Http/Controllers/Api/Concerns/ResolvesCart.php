<?php

namespace App\Http\Controllers\Api\Concerns;

use App\Models\Cart;
use App\Services\CartService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

trait ResolvesCart
{
    protected function resolveCart(Request $request): Cart
    {
        /** @var CartService $cartService */
        $cartService = app(CartService::class);

        $user = Auth::guard('sanctum')->user();

        if ($user) {
            return $cartService->resolveForUser($user);
        }

        return $cartService->resolveForGuest($request->header('X-Cart-Token'));
    }
}
