<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\GenerateProductVariationsRequest;
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
use Illuminate\Support\Str;

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

    /**
     * Create every Size x Color combination at once — one image per color,
     * reused across all of that color's sizes — instead of the admin having
     * to add each variation (and re-upload the same photo) one at a time.
     * Combinations that already exist on the product are skipped rather than
     * duplicated, so this is also safe to re-run after adding a new size/color.
     */
    public function generate(GenerateProductVariationsRequest $request, Product $product): JsonResponse
    {
        $sizes = collect($request->input('sizes'))
            ->map(fn ($s) => trim($s))
            ->filter()
            ->unique()
            ->values();

        $colorsInput = $request->input('colors');

        $basePrefix = Str::upper(Str::slug(
            $request->filled('sku_prefix') ? $request->input('sku_prefix') : $product->sku,
            '-'
        ));

        $existingCombos = $product->variations()->with('options')->get()
            ->map(fn ($v) => $this->comboKey($v->options->pluck('attribute_value', 'attribute_name')->all()))
            ->all();

        $createdIds = [];
        $skipped = 0;
        $usedSkus = [];

        DB::transaction(function () use (
            $request, $product, $sizes, $colorsInput, $basePrefix,
            &$existingCombos, &$createdIds, &$skipped, &$usedSkus
        ) {
            foreach ($colorsInput as $index => $colorInput) {
                $colorName = trim($colorInput['name']);

                $imagePath = null;
                if ($request->hasFile("colors.{$index}.image")) {
                    $imagePath = $this->imageUploadService->store(
                        $request->file("colors.{$index}.image"),
                        "products/{$product->id}/variations",
                        dedupeScope: "products/{$product->id}",
                    );
                }

                foreach ($sizes as $size) {
                    $combo = $this->comboKey(['Size' => $size, 'Color' => $colorName]);
                    if (in_array($combo, $existingCombos, true)) {
                        $skipped++;
                        continue;
                    }
                    $existingCombos[] = $combo;

                    $sku = $this->uniqueSku(
                        $basePrefix.'-'.Str::upper(Str::slug($colorName, '')).'-'.Str::upper(Str::slug($size, '')),
                        $usedSkus
                    );

                    $variation = $product->variations()->create([
                        'sku' => $sku,
                        'price' => $request->input('price') ?: null,
                        'sale_price' => $request->input('sale_price') ?: null,
                        'image' => $imagePath,
                        'status' => true,
                    ]);

                    ProductVariationOption::create(['product_variation_id' => $variation->id, 'attribute_name' => 'Size', 'attribute_value' => $size]);
                    ProductVariationOption::create(['product_variation_id' => $variation->id, 'attribute_name' => 'Color', 'attribute_value' => $colorName]);

                    $this->inventoryService->initialize(
                        $product,
                        $variation,
                        (int) $request->input('quantity', 0),
                        (int) $request->input('low_stock_threshold', 5),
                        $request->user(),
                    );

                    $createdIds[] = $variation->id;
                }
            }

            if (! empty($createdIds) && ! $product->has_variations) {
                $product->update(['has_variations' => true]);
            }
        });

        $variations = ProductVariation::whereIn('id', $createdIds)->with('options', 'inventory')->get();

        return $this->success([
            'created' => ProductVariationResource::collection($variations),
            'created_count' => count($createdIds),
            'skipped_count' => $skipped,
        ], 'Variations generated successfully', 201);
    }

    protected function comboKey(array $attributes): string
    {
        ksort($attributes);

        return collect($attributes)
            ->map(fn ($value, $name) => strtolower($name).':'.strtolower(trim($value)))
            ->implode('|');
    }

    protected function uniqueSku(string $base, array &$used): string
    {
        $sku = $base;
        $suffix = 2;

        while (in_array($sku, $used, true) || ProductVariation::where('sku', $sku)->exists()) {
            $sku = "{$base}-{$suffix}";
            $suffix++;
        }

        $used[] = $sku;

        return $sku;
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
