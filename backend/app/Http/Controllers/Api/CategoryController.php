<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::active()
            ->root()
            ->withCount('products')
            ->with(['children' => fn ($q) => $q->active()->withCount('products')])
            ->orderBy('name')
            ->get()
            ->map(fn ($category) => $this->withProductsOnly($category))
            ->filter(fn ($category) => $category->products_count > 0 || $category->children->isNotEmpty())
            ->values();

        return $this->success(CategoryResource::collection($categories));
    }

    public function show(Category $category): JsonResponse
    {
        abort_unless($category->status, 404);

        $category->loadCount('products');
        $category->load(['children' => fn ($q) => $q->active()->withCount('products')]);
        $this->withProductsOnly($category);

        return $this->success(new CategoryResource($category));
    }

    protected function withProductsOnly(Category $category): Category
    {
        $category->setRelation(
            'children',
            $category->children->filter(fn ($child) => $child->products_count > 0)->values()
        );

        return $category;
    }
}
