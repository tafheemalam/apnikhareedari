<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Services\ImageUploadService;
use App\Services\InventoryService;
use App\Services\VideoUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function __construct(
        protected ImageUploadService $imageUploadService,
        protected InventoryService $inventoryService,
        protected VideoUploadService $videoUploadService,
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
            $data = $request->safe()->except(['images', 'primary_image_index', 'stock_quantity', 'low_stock_threshold', 'video', 'remove_video']);
            $data['slug'] = $data['slug'] ?? Str::slug($request->string('name'));
            $data = array_merge($data, $this->booleanFlags($request));

            $product = Product::create($data);

            $this->storeImages($product, $request);
            $this->storeVideo($product, $request);

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
            $data = $request->safe()->except(['images', 'primary_image_index', 'stock_quantity', 'low_stock_threshold', 'video', 'remove_video']);

            if (! empty($data['name']) && empty($data['slug'])) {
                $data['slug'] = Str::slug($data['name']);
            }

            $data = array_merge($data, $this->booleanFlags($request));

            $product->update($data);

            $this->storeImages($product, $request);
            $this->storeVideo($product, $request);
        });

        $product->load(['category', 'images', 'variations.options', 'variations.inventory', 'inventory']);

        return $this->success(new ProductResource($product), 'Product updated successfully');
    }

    public function destroy(Product $product): JsonResponse
    {
        foreach ($product->images as $image) {
            $this->imageUploadService->delete($image->image);
        }
        $this->videoUploadService->delete($product->video);

        $product->delete();

        return $this->success(null, 'Product deleted successfully');
    }

    public function toggleStatus(Product $product): JsonResponse
    {
        $product->update(['status' => ! $product->status]);

        return $this->success(new ProductResource($product), 'Product status updated');
    }

    public function bulkUpdateStatus(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:products,id'],
            'status' => ['required', 'boolean'],
        ]);

        $count = Product::whereIn('id', $validated['ids'])->update(['status' => $validated['status']]);

        return $this->success(['updated' => $count], 'Product status updated');
    }

    /**
     * Suggest a SKU from the chosen category — e.g. "MOBI-0007" for the 7th
     * product (with a SKU in that sequence) under a "mobile-accessories"
     * category. Admins can still edit the result; this just gives them a
     * sensible, collision-free starting point instead of a blank field.
     */
    public function generateSku(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => ['required', 'integer', 'exists:categories,id'],
        ]);

        $category = Category::findOrFail($validated['category_id']);

        $letters = strtoupper(preg_replace('/[^a-z0-9]/i', '', $category->slug));
        $prefix = substr($letters, 0, 4) ?: 'PROD';

        $number = Product::where('sku', 'like', "{$prefix}-%")->count() + 1;

        do {
            $sku = sprintf('%s-%04d', $prefix, $number);
            $number++;
        } while (Product::where('sku', $sku)->exists());

        return $this->success(['sku' => $sku]);
    }

    public function deleteImage(Product $product, ProductImage $image): JsonResponse
    {
        abort_unless($image->product_id === $product->id, 404);

        // Storing now reuses an identical file already in the product's own
        // tree (e.g. the same photo re-picked for a variation) instead of
        // copying it, so this path may still be referenced elsewhere — only
        // unlink it from disk once nothing else points to it.
        $stillUsed = ProductImage::where('product_id', $product->id)
            ->where('id', '!=', $image->id)
            ->where('image', $image->image)
            ->exists()
            || $product->variations()->where('image', $image->image)->exists();

        if (! $stillUsed) {
            $this->imageUploadService->delete($image->image);
        }

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

        foreach (['has_variations', 'status', 'featured', 'new_arrival', 'best_seller', 'show_in_basket'] as $flag) {
            if ($request->has($flag)) {
                $flags[$flag] = $request->boolean($flag);
            }
        }

        return $flags;
    }

    protected function storeVideo(Product $product, Request $request): void
    {
        if ($request->hasFile('video')) {
            $this->videoUploadService->delete($product->video);
            $product->update(['video' => $this->videoUploadService->store($request->file('video'), "products/{$product->id}/video")]);

            return;
        }

        if ($request->boolean('remove_video') && $product->video) {
            $this->videoUploadService->delete($product->video);
            $product->update(['video' => null]);
        }
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

            // Re-selecting (or accidentally resubmitting) a photo already
            // attached to this product reuses the same stored file instead of
            // writing a second copy — but without this check it would still
            // add a second gallery entry pointing at that same file, which is
            // the "same image shown twice" bug this guards against.
            if ($product->images()->where('image', $path)->exists()) {
                continue;
            }

            ProductImage::create([
                'product_id' => $product->id,
                'image' => $path,
                'is_primary' => ! $hasPrimaryAlready && $index === $primaryIndex,
                'sort_order' => ++$nextSort,
            ]);
        }
    }
}
