<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CouponRequest;
use App\Http\Resources\CouponResource;
use App\Models\Coupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $coupons = Coupon::query()
            ->when($request->filled('search'), fn ($q) => $q->where('code', 'like', '%'.$request->string('search').'%'))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->boolean('status')))
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return $this->success($coupons->through(fn ($coupon) => new CouponResource($coupon)));
    }

    public function store(CouponRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['code'] = strtoupper($data['code']);
        $data['status'] = $request->has('status') ? $request->boolean('status') : true;
        $data['used_count'] = 0;

        $coupon = Coupon::create($data);

        return $this->success(new CouponResource($coupon), 'Coupon created successfully', 201);
    }

    public function show(Coupon $coupon): JsonResponse
    {
        return $this->success(new CouponResource($coupon));
    }

    public function update(CouponRequest $request, Coupon $coupon): JsonResponse
    {
        $data = $request->validated();
        $data['code'] = strtoupper($data['code']);

        if ($request->has('status')) {
            $data['status'] = $request->boolean('status');
        }

        $coupon->update($data);

        return $this->success(new CouponResource($coupon), 'Coupon updated successfully');
    }

    public function destroy(Coupon $coupon): JsonResponse
    {
        $coupon->delete();

        return $this->success(null, 'Coupon deleted successfully');
    }

    public function toggleStatus(Coupon $coupon): JsonResponse
    {
        $coupon->update(['status' => ! $coupon->status]);

        return $this->success(new CouponResource($coupon), 'Coupon status updated');
    }
}
