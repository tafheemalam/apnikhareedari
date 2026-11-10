<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesCart;
use App\Http\Controllers\Controller;
use App\Http\Requests\CheckoutRequest;
use App\Http\Resources\OrderResource;
use App\Services\CheckoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use RuntimeException;

class CheckoutController extends Controller
{
    use ResolvesCart;

    public function __construct(
        protected CheckoutService $checkoutService,
    ) {}

    public function store(CheckoutRequest $request): JsonResponse
    {
        $user = Auth::guard('sanctum')->user();
        $cart = $this->resolveCart($request)->load('items.product', 'items.variation', 'basketInstances.items.product', 'basketInstances.items.variation');

        try {
            $order = $this->checkoutService->process($cart, $request->validated(), $user);
        } catch (RuntimeException $e) {
            return $this->error($e->getMessage(), null, 422);
        }

        $this->checkoutService->sendPlacementNotifications($order);

        $data = (new OrderResource($order))->resolve($request);

        // A brand-new guest account was created for this order — log the
        // browser in as that account so the customer lands on "My Orders"
        // without having to register separately.
        if ($this->checkoutService->issuedToken) {
            $data['auth_token'] = $this->checkoutService->issuedToken;
        }

        return $this->success($data, 'Order placed successfully', 201);
    }
}
