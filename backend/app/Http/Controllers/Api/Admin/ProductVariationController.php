<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProductVariationRequest;
use App\Http\Resources\ProductVariationResource;
use App\Models\Product;
use App\Models\ProductImage;
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
                $data['image'] = $this->imageUploadService->store(
                    $request->file('image'),
                    "products/{$product->id}/variations",
                    dedupeScope: "products/{$product->id}",
                );
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
            $data = $request->safe()->except(['options', 'quantity', 'low_stock_threshold', 'image', 'remove_image']);

            if ($request->has('status')) {
                $data['status'] = $request->boolean('status');
            }

            if ($request->hasFile('image')) {
                $this->deleteImageIfUnused($variation, $variation->image);
                $data['image'] = $this->imageUploadService->store(
                    $request->file('image'),
                    "products/{$variation->product_id}/variations",
                    dedupeScope: "products/{$variation->product_id}",
                );
            } elseif ($request->boolean('remove_image')) {
                $this->deleteImageIfUnused($variation, $variation->image);
                $data['image'] = null;
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

        $this->deleteImageIfUnused($variation, $variation->image);
        $variation->delete();

        if ($product->variations()->count() === 0) {
            $product->update(['has_variations' => false]);
        }

        return $this->success(null, 'Variation deleted successfully');
    }

    /**
     * Deleting a variation's image used to always remove the physical file —
     * but since storing now reuses an identical file already belonging to the
     * product (or another variation) instead of copying it, that same path can
     * be referenced from more than one place. Only unlink it from disk once
     * nothing else still points to it.
     */
    protected function deleteImageIfUnused(ProductVariation $variation, ?string $path): void
    {
        if (! $path) {
            return;
        }

        $stillUsed = ProductImage::where('product_id', $variation->product_id)->where('image', $path)->exists()
            || ProductVariation::where('product_id', $variation->product_id)
                ->where('id', '!=', $variation->id)
                ->where('image', $path)
                ->exists();

        if (! $stillUsed) {
            $this->imageUploadService->delete($path);
        }
    }
}
