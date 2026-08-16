<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProductVariationRequest;
use App\Http\Resources\ProductVariationResource;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\ProductVariationOption;
use App\Services\ImageUploadService;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ProductVariationController extends Controller
{
    public function __construct(
        protected ImageUploadService $imageUploadService,
        protected InventoryService $inventoryService,
    ) {}

    public function index(Product $product): JsonResponse
    {
        $variations = $product->variations()->with(['options', 'inventory'])->get();

        return $this->success(ProductVariationResource::collection($variations));
    }

    public function store(ProductVariationRequest $request, Product $product): JsonResponse
    {
        $variation = DB::transaction(function () use ($request, $product) {
            $data = $request->safe()->except(['options', 'quantity', 'low_stock_threshold', 'image']);

            if ($request->has('status')) {
                $data['status'] = $request->boolean('status');
            }

            if ($request->hasFile('image')) {
                $data['image'] = $this->imageUploadService->store($request->file('image'), "products/{$product->id}/variations");
            }

            $variation = $product->variations()->create($data);

            foreach ($request->input('options') as $option) {
                ProductVariationOption::create([
                    'product_variation_id' => $variation->id,
                    'attribute_name' => $option['attribute_name'],
                    'attribute_value' => $option['attribute_value'],
                ]);
            }

            $this->inventoryService->initialize(
                $product,
                $variation,
                (int) $request->input('quantity', 0),
                (int) $request->input('low_stock_threshold', 5),
                $request->user(),
            );

            if (! $product->has_variations) {
                $product->update(['has_variations' => true]);
            }

            return $variation;
        });

        $variation->load('options', 'inventory');

        return $this->success(new ProductVariationResource($variation), 'Variation created successfully', 201);
    }

    public function update(ProductVariationRequest $request, Product $product, ProductVariation $variation): JsonResponse
    {
        abort_unless($variation->product_id === $product->id, 404);

        DB::transaction(function () use ($request, $variation) {
            $data = $request->safe()->except(['options', 'quantity', 'low_stock_threshold', 'image']);

            if ($request->has('status')) {
                $data['status'] = $request->boolean('status');
            }

            if ($request->hasFile('image')) {
                $this->imageUploadService->delete($variation->image);
                $data['image'] = $this->imageUploadService->store($request->file('image'), "products/{$variation->product_id}/variations");
            }

            $variation->update($data);

            if ($request->has('options')) {
                $variation->options()->delete();
                foreach ($request->input('options') as $option) {
                    ProductVariationOption::create([
                        'product_variation_id' => $variation->id,
                        'attribute_name' => $option['attribute_name'],
                        'attribute_value' => $option['attribute_value'],
                    ]);
                }
            }
        });

        $variation->load('options', 'inventory');

        return $this->success(new ProductVariationResource($variation), 'Variation updated successfully');
    }

    public function destroy(Product $product, ProductVariation $variation): JsonResponse
    {
        abort_unless($variation->product_id === $product->id, 404);

        $this->imageUploadService->delete($variation->image);
        $variation->delete();

        if ($product->variations()->count() === 0) {
            $product->update(['has_variations' => false]);
        }

        return $this->success(null, 'Variation deleted successfully');
    }
}
