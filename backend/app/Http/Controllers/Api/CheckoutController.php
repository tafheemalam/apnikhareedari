<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CheckoutRequest;
use App\Http\Resources\OrderResource;
use App\Services\CartService;
use App\Services\CheckoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use RuntimeException;

class CheckoutController extends Controller
{
    public function __construct(
        protected CheckoutService $checkoutService,
        protected CartService $cartService,
    ) {}

    public function store(CheckoutRequest $request): JsonResponse
    {
        $user = Auth::guard('sanctum')->user();

        $cart = $user
            ? $this->cartService->resolveForUser($user)
            : $this->cartService->resolveForGuest($request->header('X-Cart-Token'));

        $cart->load('items.product', 'items.variation');

        try {
            $order = $this->checkoutService->process($cart, $request->validated(), $user);
        } catch (RuntimeException $e) {
            return $this->error($e->getMessage(), null, 422);
        }

        $this->checkoutService->sendPlacementNotifications($order);

        return $this->success(new OrderResource($order), 'Order placed successfully', 201);
    }
}
