<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\InventoryAdjustRequest;
use App\Http\Requests\Admin\InventorySetRequest;
use App\Http\Resources\InventoryResource;
use App\Http\Resources\InventoryTransactionResource;
use App\Models\Inventory;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function __construct(protected InventoryService $inventoryService) {}

    public function index(Request $request): JsonResponse
    {
        $inventory = Inventory::query()
            ->with(['product.category', 'variation.options'])
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = $request->string('search');
                $q->whereHas('product', fn ($pq) => $pq->where('name', 'like', "%{$term}%")->orWhere('sku', 'like', "%{$term}%"));
            })
            ->when($request->filled('category_id'), fn ($q) => $q->whereHas('product', fn ($pq) => $pq->where('category_id', $request->input('category_id'))))
            ->when($request->input('stock_status') === 'low', fn ($q) => $q->lowStock())
            ->when($request->input('stock_status') === 'out', fn ($q) => $q->outOfStock())
            ->when($request->input('stock_status') === 'in', fn ($q) => $q->where('quantity', '>', 0))
            ->paginate($request->integer('per_page', 20));

        return $this->success($inventory->through(fn ($item) => new InventoryResource($item)));
    }

    public function lowStock(): JsonResponse
    {
        $items = Inventory::with(['product', 'variation.options'])->lowStock()->get();

        return $this->success(InventoryResource::collection($items));
    }

    public function outOfStock(): JsonResponse
    {
        $items = Inventory::with(['product', 'variation.options'])->outOfStock()->get();

        return $this->success(InventoryResource::collection($items));
    }

    public function history(Inventory $inventory): JsonResponse
    {
        $transactions = $inventory->product->inventoryTransactions()
            ->when($inventory->product_variation_id, fn ($q) => $q->where('product_variation_id', $inventory->product_variation_id))
            ->when(! $inventory->product_variation_id, fn ($q) => $q->whereNull('product_variation_id'))
            ->with('user')
            ->latest()
            ->paginate(20);

        return $this->success($transactions->through(fn ($t) => new InventoryTransactionResource($t)));
    }

    public function increase(InventoryAdjustRequest $request, Inventory $inventory): JsonResponse
    {
        if (! in_array($request->validated('type'), ['purchase', 'return', 'cancellation'], true)) {
            return $this->error('Invalid transaction type for a stock increase', null, 422);
        }

        $this->inventoryService->increase(
            $inventory->product,
            $inventory->variation,
            $request->validated('quantity'),
            $request->validated('type'),
            notes: $request->validated('notes'),
            actor: $request->user(),
        );

        return $this->success(new InventoryResource($inventory->fresh()), 'Stock increased successfully');
    }

    public function decrease(InventoryAdjustRequest $request, Inventory $inventory): JsonResponse
    {
        if (! in_array($request->validated('type'), ['sale', 'damage'], true)) {
            return $this->error('Invalid transaction type for a stock decrease', null, 422);
        }

        try {
            $this->inventoryService->decrease(
                $inventory->product,
                $inventory->variation,
                $request->validated('quantity'),
                $request->validated('type'),
                notes: $request->validated('notes'),
                actor: $request->user(),
            );
        } catch (\RuntimeException $e) {
            return $this->error($e->getMessage(), null, 422);
        }

        return $this->success(new InventoryResource($inventory->fresh()), 'Stock decreased successfully');
    }

    public function setQuantity(InventorySetRequest $request, Inventory $inventory): JsonResponse
    {
        $this->inventoryService->setQuantity(
            $inventory->product,
            $inventory->variation,
            $request->validated('quantity'),
            $request->validated('notes'),
            $request->user(),
        );

        return $this->success(new InventoryResource($inventory->fresh()), 'Stock adjusted successfully');
    }
}
