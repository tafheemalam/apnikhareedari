<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::query()
            ->active()
            ->with(['category:id,name,slug', 'images'])
            ->withCount('reviews')
            ->withAvg('reviews', 'rating')
            ->search($request->string('search')->toString() ?: null)
            ->when($request->filled('category_id'), fn ($q) => $q->where('category_id', $request->input('category_id')))
            ->when($request->filled('category_slug'), function ($q) use ($request) {
                // Products can only be assigned to leaf categories, so a parent category
                // (e.g. "Electronics") has no products of its own — browsing it should
                // show everything from its subcategories combined, not an empty page.
                $category = Category::where('slug', $request->string('category_slug'))->first();
                $categoryIds = $category
                    ? [$category->id, ...$category->children()->pluck('id')]
                    : [-1];

                $q->whereIn('category_id', $categoryIds);
            })
            ->when($request->filled('min_price'), fn ($q) => $q->where('price', '>=', $request->input('min_price')))
            ->when($request->filled('max_price'), fn ($q) => $q->where('price', '<=', $request->input('max_price')))
            ->when($request->filled('min_rating'), function ($q) use ($request) {
                $q->having('reviews_avg_rating', '>=', $request->input('min_rating'));
            })
            ->when($request->boolean('featured'), fn ($q) => $q->featured())
            ->when($request->boolean('new_arrival'), fn ($q) => $q->newArrival())
            ->when($request->boolean('best_seller'), fn ($q) => $q->bestSeller())
            ->when($request->boolean('on_sale'), fn ($q) => $q->onSale())
            ->when($request->boolean('show_in_basket'), fn ($q) => $q->where('show_in_basket', true))
            ->when($request->input('availability') === 'in_stock', function ($q) {
                $q->where(function ($sub) {
                    $sub->whereHas('inventory', fn ($iq) => $iq->where('quantity', '>', 0))
                        ->orWhereHas('variations.inventory', fn ($iq) => $iq->where('quantity', '>', 0));
                });
            });

        $query = match ($request->input('sort')) {
            'price_low_high' => $query->orderBy('price'),
            'price_high_low' => $query->orderByDesc('price'),
            'popular' => $query->orderByDesc('reviews_count'),
            'best_selling' => $query->orderByDesc('best_seller')->latest(),
            default => $query->latest(),
        };

        $products = $query->paginate($request->integer('per_page', 20));

        return $this->success($products->through(fn ($product) => new ProductResource($product)));
    }

    public function show(Product $product): JsonResponse
    {
        abort_unless($product->status, 404);

        $product->load([
            'category',
            'images',
            'variations' => fn ($q) => $q->active()->with(['options', 'inventory']),
            'inventory',
            'approvedReviews.user:id,name',
        ])->loadCount('reviews')->loadAvg('reviews', 'rating');

        return $this->success(new ProductResource($product));
    }
}
