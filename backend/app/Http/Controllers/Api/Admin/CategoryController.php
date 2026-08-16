<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Services\ImageUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function __construct(protected ImageUploadService $imageUploadService) {}

    public function index(Request $request): JsonResponse
    {
        $categories = Category::query()
            ->withCount('products')
            ->with('parent:id,name,slug')
            ->when($request->filled('search'), fn ($q) => $q->where('name', 'like', '%'.$request->string('search').'%'))
            ->when($request->filled('parent_id'), fn ($q) => $q->where('parent_id', $request->input('parent_id')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->boolean('status')))
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate($request->integer('per_page', 20));

        return $this->success($categories->through(fn ($category) => new CategoryResource($category)));
    }

    public function store(CategoryRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['slug'] = $data['slug'] ?? Str::slug($data['name']);

        if ($request->has('status')) {
            $data['status'] = $request->boolean('status');
        }

        if ($request->hasFile('image')) {
            $data['image'] = $this->imageUploadService->store($request->file('image'), 'categories');
        }

        $category = Category::create($data);

        return $this->success(new CategoryResource($category), 'Category created successfully', 201);
    }

    public function show(Category $category): JsonResponse
    {
        $category->load('parent', 'children');

        return $this->success(new CategoryResource($category));
    }

    public function update(CategoryRequest $request, Category $category): JsonResponse
    {
        $data = $request->validated();

        if (! empty($data['name']) && empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        if ($request->has('status')) {
            $data['status'] = $request->boolean('status');
        }

        if ($request->hasFile('image')) {
            $this->imageUploadService->delete($category->image);
            $data['image'] = $this->imageUploadService->store($request->file('image'), 'categories');
        }

        $category->update($data);

        return $this->success(new CategoryResource($category), 'Category updated successfully');
    }

    public function destroy(Category $category): JsonResponse
    {
        if ($category->products()->exists() || $category->children()->exists()) {
            return $this->error('Cannot delete a category that has products or subcategories', null, 422);
        }

        $this->imageUploadService->delete($category->image);
        $category->delete();

        return $this->success(null, 'Category deleted successfully');
    }

    public function toggleStatus(Category $category): JsonResponse
    {
        $category->update(['status' => ! $category->status]);

        return $this->success(new CategoryResource($category), 'Category status updated');
    }
}
