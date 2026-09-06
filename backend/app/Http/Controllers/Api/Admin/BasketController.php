<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BasketRequest;
use App\Http\Resources\BasketResource;
use App\Models\Basket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BasketController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $baskets = Basket::query()
            ->when($request->filled('search'), fn ($q) => $q->where('name', 'like', '%'.$request->string('search').'%'))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->boolean('status')))
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return $this->success($baskets->through(fn ($basket) => new BasketResource($basket)));
    }

    public function store(BasketRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['status'] = $request->has('status') ? $request->boolean('status') : true;

        $basket = Basket::create($data);

        return $this->success(new BasketResource($basket), 'Basket created successfully', 201);
    }

    public function show(Basket $basket): JsonResponse
    {
        return $this->success(new BasketResource($basket));
    }

    public function update(BasketRequest $request, Basket $basket): JsonResponse
    {
        $data = $request->validated();

        if ($request->has('status')) {
            $data['status'] = $request->boolean('status');
        }

        $basket->update($data);

        return $this->success(new BasketResource($basket), 'Basket updated successfully');
    }

    public function destroy(Basket $basket): JsonResponse
    {
        $basket->delete();

        return $this->success(null, 'Basket deleted successfully');
    }

    public function toggleStatus(Basket $basket): JsonResponse
    {
        $basket->update(['status' => ! $basket->status]);

        return $this->success(new BasketResource($basket), 'Basket status updated');
    }
}
