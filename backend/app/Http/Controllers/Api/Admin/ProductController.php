<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Models\ProductImage;
use App\Services\ImageUploadService;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function __construct(
        protected ImageUploadService $imageUploadService,
        protected InventoryService $inventoryService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $products = Product::query()
            ->with(['category:id,name,slug', 'images'])
            ->withCount('reviews')
            ->when($request->filled('search'), fn ($q) => $q->search($request->string('search')))
            ->when($request->filled('category_id'), fn ($q) => $q->where('category_id', $request->input('category_id')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->boolean('status')))
            ->when($request->boolean('low_stock'), fn ($q) => $q->whereHas('inventory', fn ($iq) => $iq->lowStock())
                ->orWhereHas('variations.inventory', fn ($iq) => $iq->lowStock()))
            ->when($request->boolean('out_of_stock'), fn ($q) => $q->whereHas('inventory', fn ($iq) => $iq->outOfStock())
                ->orWhereHas('variations.inventory', fn ($iq) => $iq->outOfStock()))
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return $this->success($products->through(fn ($product) => new ProductResource($product)));
    }

    public function store(ProductRequest $request): JsonResponse
    {
        $product = DB::transaction(function () use ($request) {
            $data = $request->safe()->except(['images', 'primary_image_index', 'stock_quantity', 'low_stock_threshold']);
            $data['slug'] = $data['slug'] ?? Str::slug($request->string('name'));
            $data = array_merge($data, $this->booleanFlags($request));

            $product = Product::create($data);

            $this->storeImages($product, $request);

            if (! $product->has_variations) {
                $this->inventoryService->initialize(
                    $product,
                    null,
                    (int) $request->input('stock_quantity', 0),
                    (int) $request->input('low_stock_threshold', 5),
                    $request->user(),
                );
            }

            return $product;
        });

        $product->load(['category', 'images', 'variations.options', 'variations.inventory', 'inventory']);

        return $this->success(new ProductResource($product), 'Product created successfully', 201);
    }

    public function show(Product $product): JsonResponse
    {
        $product->load(['category', 'images', 'variations.options', 'variations.inventory', 'inventory'])
            ->loadCount('reviews');

        return $this->success(new ProductResource($product));
    }

    public function update(ProductRequest $request, Product $product): JsonResponse
    {
        DB::transaction(function () use ($request, $product) {
            $data = $request->safe()->except(['images', 'primary_image_index', 'stock_quantity', 'low_stock_threshold']);

            if (! empty($data['name']) && empty($data['slug'])) {
                $data['slug'] = Str::slug($data['name']);
            }

            $data = array_merge($data, $this->booleanFlags($request));

            $product->update($data);

            $this->storeImages($product, $request);
        });

        $product->load(['category', 'images', 'variations.options', 'variations.inventory', 'inventory']);

        return $this->success(new ProductResource($product), 'Product updated successfully');
    }

    public function destroy(Product $product): JsonResponse
    {
        foreach ($product->images as $image) {
            $this->imageUploadService->delete($image->image);
        }

        $product->delete();

        return $this->success(null, 'Product deleted successfully');
    }

    public function toggleStatus(Product $product): JsonResponse
    {
        $product->update(['status' => ! $product->status]);

        return $this->success(new ProductResource($product), 'Product status updated');
    }

    public function deleteImage(Product $product, ProductImage $image): JsonResponse
    {
        abort_unless($image->product_id === $product->id, 404);

        $this->imageUploadService->delete($image->image);
        $wasPrimary = $image->is_primary;
        $image->delete();

        if ($wasPrimary) {
            $next = $product->images()->orderBy('sort_order')->first();
            $next?->update(['is_primary' => true]);
        }

        return $this->success(null, 'Image deleted successfully');
    }

    public function setPrimaryImage(Product $product, ProductImage $image): JsonResponse
    {
        abort_unless($image->product_id === $product->id, 404);

        DB::transaction(function () use ($product, $image) {
            $product->images()->update(['is_primary' => false]);
            $image->update(['is_primary' => true]);
        });

        return $this->success(null, 'Primary image updated');
    }

    /**
     * @return array<string, bool>
     */
    protected function booleanFlags(Request $request): array
    {
        $flags = [];

        foreach (['has_variations', 'status', 'featured', 'new_arrival', 'best_seller'] as $flag) {
            if ($request->has($flag)) {
                $flags[$flag] = $request->boolean($flag);
            }
        }

        return $flags;
    }

    protected function storeImages(Product $product, Request $request): void
    {
        if (! $request->hasFile('images')) {
            return;
        }

        $hasPrimaryAlready = $product->images()->where('is_primary', true)->exists();
        $primaryIndex = $request->integer('primary_image_index', 0);
        $nextSort = (int) $product->images()->max('sort_order');

        foreach ($request->file('images') as $index => $file) {
            $path = $this->imageUploadService->store($file, "products/{$product->id}");

            ProductImage::create([
                'product_id' => $product->id,
                'image' => $path,
                'is_primary' => ! $hasPrimaryAlready && $index === $primaryIndex,
                'sort_order' => ++$nextSort,
            ]);
        }
    }
}
