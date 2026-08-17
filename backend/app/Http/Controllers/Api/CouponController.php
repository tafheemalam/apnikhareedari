<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    public function validateCoupon(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string'],
            'subtotal' => ['required', 'numeric', 'min:0'],
        ]);

        $coupon = Coupon::where('code', strtoupper($request->string('code')))->first();

        if (! $coupon) {
            return $this->error('Invalid coupon code', null, 404);
        }

        if (! $coupon->isValidFor((float) $request->input('subtotal'))) {
            return $this->error('This coupon is not valid for your order', null, 422);
        }

        $discount = $coupon->calculateDiscount((float) $request->input('subtotal'));

        return $this->success([
            'code' => $coupon->code,
            'type' => $coupon->type,
            'value' => $coupon->value,
            'discount_amount' => $discount,
        ], 'Coupon applied successfully');
    }
}
