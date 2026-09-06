<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BasketResource;
use App\Models\Basket;
use Illuminate\Http\JsonResponse;

class BasketController extends Controller
{
    public function index(): JsonResponse
    {
        $baskets = Basket::active()->latest()->get();

        return $this->success(BasketResource::collection($baskets));
    }
}
