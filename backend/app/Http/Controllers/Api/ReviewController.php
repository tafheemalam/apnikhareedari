<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReviewRequest;
use App\Http\Resources\ProductReviewResource;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Product $product): JsonResponse
    {
        $reviews = $product->approvedReviews()->with('user:id,name')->latest()->paginate(10);

        return $this->success($reviews->through(fn ($review) => new ProductReviewResource($review)));
    }

    public function store(ReviewRequest $request, Product $product): JsonResponse
    {
        $user = $request->user();

        if ($product->reviews()->where('user_id', $user->id)->exists()) {
            return $this->error('You have already reviewed this product', null, 422);
        }

        $purchasedOrderItem = Order::where('user_id', $user->id)
            ->where('status', 'delivered')
            ->whereHas('items', fn ($q) => $q->where('product_id', $product->id))
            ->first();

        if (! $purchasedOrderItem) {
            return $this->error('You can only review products from delivered orders', null, 403);
        }

        $review = ProductReview::create([
            'product_id' => $product->id,
            'user_id' => $user->id,
            'order_id' => $purchasedOrderItem->id,
            'rating' => $request->validated('rating'),
            'title' => $request->validated('title'),
            'comment' => $request->validated('comment'),
            'status' => 'pending',
        ]);

        return $this->success(new ProductReviewResource($review), 'Review submitted and awaiting approval', 201);
    }

    public function update(ReviewRequest $request, ProductReview $review): JsonResponse
    {
        $this->authorize('update', $review);

        $review->update([
            ...$request->validated(),
            'status' => 'pending',
        ]);

        return $this->success(new ProductReviewResource($review), 'Review updated and awaiting re-approval');
    }
}
