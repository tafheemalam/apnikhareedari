<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductReviewResource;
use App\Models\ProductReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $reviews = ProductReview::query()
            ->with(['product:id,name,slug', 'user:id,name'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->when($request->filled('product_id'), fn ($q) => $q->where('product_id', $request->input('product_id')))
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return $this->success($reviews->through(fn ($review) => new ProductReviewResource($review)));
    }

    public function approve(ProductReview $review): JsonResponse
    {
        $review->update(['status' => 'approved']);

        return $this->success(new ProductReviewResource($review), 'Review approved');
    }

    public function reject(ProductReview $review): JsonResponse
    {
        $review->update(['status' => 'rejected']);

        return $this->success(new ProductReviewResource($review), 'Review rejected');
    }

    public function destroy(ProductReview $review): JsonResponse
    {
        $review->delete();

        return $this->success(null, 'Review deleted successfully');
    }
}
