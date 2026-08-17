<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ShippingZoneRequest;
use App\Http\Resources\ShippingZoneResource;
use App\Models\ShippingZone;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ShippingZoneController extends Controller
{
    public function index(): JsonResponse
    {
        $zones = ShippingZone::with('rates')->orderBy('name')->get();

        return $this->success(ShippingZoneResource::collection($zones));
    }

    public function store(ShippingZoneRequest $request): JsonResponse
    {
        $zone = DB::transaction(function () use ($request) {
            $zone = ShippingZone::create([
                'name' => $request->validated('name'),
                'status' => $request->has('status') ? $request->boolean('status') : true,
            ]);

            $zone->rates()->create($request->safe()->only([
                'rate', 'free_shipping_threshold', 'estimated_delivery_days_min', 'estimated_delivery_days_max',
            ]));

            return $zone;
        });

        return $this->success(new ShippingZoneResource($zone->load('rates')), 'Shipping zone created successfully', 201);
    }

    public function update(ShippingZoneRequest $request, ShippingZone $zone): JsonResponse
    {
        DB::transaction(function () use ($request, $zone) {
            $zone->update([
                'name' => $request->validated('name'),
                'status' => $request->has('status') ? $request->boolean('status') : $zone->status,
            ]);

            $rateData = $request->safe()->only([
                'rate', 'free_shipping_threshold', 'estimated_delivery_days_min', 'estimated_delivery_days_max',
            ]);

            $rate = $zone->rates()->first();
            $rate ? $rate->update($rateData) : $zone->rates()->create($rateData);
        });

        return $this->success(new ShippingZoneResource($zone->load('rates')), 'Shipping zone updated successfully');
    }

    public function destroy(ShippingZone $zone): JsonResponse
    {
        $zone->delete();

        return $this->success(null, 'Shipping zone deleted successfully');
    }
}
