<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ShippingZoneResource;
use App\Models\ShippingZone;
use App\Services\ShippingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShippingController extends Controller
{
    public function zones(): JsonResponse
    {
        $zones = ShippingZone::active()->with('rates')->orderBy('name')->get();

        return $this->success(ShippingZoneResource::collection($zones));
    }

    public function estimate(Request $request, ShippingService $shippingService): JsonResponse
    {
        $request->validate([
            'city' => ['required', 'string'],
            'subtotal' => ['required', 'numeric', 'min:0'],
        ]);

        return $this->success($shippingService->calculate($request->string('city'), (float) $request->input('subtotal')));
    }
}
