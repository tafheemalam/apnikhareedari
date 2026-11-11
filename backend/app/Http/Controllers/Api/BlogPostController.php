<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BlogPostResource;
use App\Models\BlogPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BlogPostController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $posts = BlogPost::published()
            ->with('author:id,name')
            ->orderByDesc('published_at')
            ->paginate($request->integer('per_page', 9));

        return $this->success($posts->through(fn ($post) => new BlogPostResource($post)));
    }

    public function show(BlogPost $post): JsonResponse
    {
        abort_unless($post->status && ($post->published_at === null || $post->published_at->isPast()), 404);

        $post->load('author:id,name');

        return $this->success(new BlogPostResource($post));
    }
}
