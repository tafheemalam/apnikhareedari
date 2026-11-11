<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BlogPostRequest;
use App\Http\Resources\BlogPostResource;
use App\Models\BlogPost;
use App\Services\ImageUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BlogPostController extends Controller
{
    public function __construct(protected ImageUploadService $imageUploadService) {}

    public function index(Request $request): JsonResponse
    {
        $posts = BlogPost::query()
            ->with('author:id,name')
            ->when($request->filled('search'), fn ($q) => $q->where('title', 'like', '%'.$request->string('search').'%'))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->boolean('status')))
            ->latest('created_at')
            ->paginate($request->integer('per_page', 15));

        return $this->success($posts->through(fn ($post) => new BlogPostResource($post)));
    }

    public function store(BlogPostRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['status'] = $request->has('status') ? $request->boolean('status') : false;
        $data['author_id'] = $request->user()->id;

        if ($data['status'] && empty($data['published_at'])) {
            $data['published_at'] = now();
        }

        if ($request->hasFile('featured_image')) {
            $data['featured_image'] = $this->imageUploadService->store($request->file('featured_image'), 'blog');
        }

        $post = BlogPost::create($data);

        return $this->success(new BlogPostResource($post), 'Blog post created successfully', 201);
    }

    public function show(BlogPost $blogPost): JsonResponse
    {
        $blogPost->load('author:id,name');

        return $this->success(new BlogPostResource($blogPost));
    }

    public function update(BlogPostRequest $request, BlogPost $blogPost): JsonResponse
    {
        $data = $request->validated();

        if ($request->has('status')) {
            $data['status'] = $request->boolean('status');
        }

        if (($data['status'] ?? $blogPost->status) && empty($data['published_at']) && ! $blogPost->published_at) {
            $data['published_at'] = now();
        }

        if ($request->hasFile('featured_image')) {
            $this->imageUploadService->delete($blogPost->featured_image);
            $data['featured_image'] = $this->imageUploadService->store($request->file('featured_image'), 'blog');
        }

        $blogPost->update($data);

        return $this->success(new BlogPostResource($blogPost), 'Blog post updated successfully');
    }

    public function destroy(BlogPost $blogPost): JsonResponse
    {
        $this->imageUploadService->delete($blogPost->featured_image);
        $blogPost->delete();

        return $this->success(null, 'Blog post deleted successfully');
    }

    public function toggleStatus(BlogPost $blogPost): JsonResponse
    {
        $status = ! $blogPost->status;
        $publishedAt = $blogPost->published_at;

        if ($status && ! $publishedAt) {
            $publishedAt = now();
        }

        $blogPost->update(['status' => $status, 'published_at' => $publishedAt]);

        return $this->success(new BlogPostResource($blogPost), 'Blog post status updated');
    }
}
