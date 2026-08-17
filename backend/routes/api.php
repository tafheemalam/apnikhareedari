<?php

use App\Http\Controllers\Api\Admin\AdminUserController;
use App\Http\Controllers\Api\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Api\Admin\CouponController as AdminCouponController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\InventoryController;
use App\Http\Controllers\Api\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Api\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Api\Admin\ProductVariationController;
use App\Http\Controllers\Api\Admin\ReviewController as AdminReviewController;
use App\Http\Controllers\Api\Admin\SettingController as AdminSettingController;
use App\Http\Controllers\Api\Admin\ShippingZoneController;
use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Auth\ProfileController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\CouponController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\ShippingController;
use App\Http\Controllers\Api\WishlistController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
    Route::post('reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
    });
});

// Public storefront catalog & content
Route::get('categories', [CategoryController::class, 'index']);
Route::get('categories/{category:slug}', [CategoryController::class, 'show']);
Route::get('products', [ProductController::class, 'index']);
Route::get('products/{product:slug}', [ProductController::class, 'show']);
Route::get('products/{product}/reviews', [ReviewController::class, 'index']);
Route::get('settings/public', [SettingController::class, 'index']);
Route::get('shipping/zones', [ShippingController::class, 'zones']);
Route::post('shipping/estimate', [ShippingController::class, 'estimate']);
Route::post('coupons/validate', [CouponController::class, 'validateCoupon']);

// Cart works for both guests (X-Cart-Token header) and authenticated users
Route::prefix('cart')->group(function () {
    Route::get('/', [CartController::class, 'show']);
    Route::post('items', [CartController::class, 'addItem']);
    Route::put('items/{item}', [CartController::class, 'updateItem']);
    Route::delete('items/{item}', [CartController::class, 'removeItem']);
    Route::delete('/', [CartController::class, 'clear']);
});

Route::post('checkout', [CheckoutController::class, 'store'])->middleware('throttle:20,1');

// Authenticated customer routes
Route::middleware('auth:sanctum')->group(function () {
    Route::put('profile', [ProfileController::class, 'update']);
    Route::put('profile/password', [ProfileController::class, 'changePassword']);

    Route::apiResource('addresses', AddressController::class)->except(['show']);
    Route::patch('addresses/{address}/default', [AddressController::class, 'setDefault']);

    Route::get('wishlist', [WishlistController::class, 'index']);
    Route::post('wishlist', [WishlistController::class, 'store']);
    Route::delete('wishlist/{product}', [WishlistController::class, 'destroy']);
    Route::post('wishlist/{product}/move-to-cart', [WishlistController::class, 'moveToCart']);

    Route::get('orders', [OrderController::class, 'index']);
    Route::get('orders/{orderNumber}', [OrderController::class, 'show']);
    Route::post('orders/{orderNumber}/cancel', [OrderController::class, 'cancel']);
    Route::get('orders/{orderNumber}/invoice', [OrderController::class, 'invoice']);

    Route::post('products/{product}/reviews', [ReviewController::class, 'store']);
    Route::put('reviews/{review}', [ReviewController::class, 'update']);
});

// Admin-only routes
Route::prefix('admin')->name('admin.')->middleware(['auth:sanctum'])->group(function () {
    Route::middleware('permission:view-dashboard')->get('dashboard', [DashboardController::class, 'index']);

    Route::middleware('permission:manage-categories')->group(function () {
        Route::apiResource('categories', AdminCategoryController::class);
        Route::patch('categories/{category}/toggle-status', [AdminCategoryController::class, 'toggleStatus']);
    });

    Route::middleware('permission:manage-products')->group(function () {
        Route::apiResource('products', AdminProductController::class);
        Route::patch('products/{product}/toggle-status', [AdminProductController::class, 'toggleStatus']);
        Route::delete('products/{product}/images/{image}', [AdminProductController::class, 'deleteImage']);
        Route::patch('products/{product}/images/{image}/primary', [AdminProductController::class, 'setPrimaryImage']);

        Route::get('products/{product}/variations', [ProductVariationController::class, 'index']);
        Route::post('products/{product}/variations', [ProductVariationController::class, 'store']);
        Route::put('products/{product}/variations/{variation}', [ProductVariationController::class, 'update']);
        Route::delete('products/{product}/variations/{variation}', [ProductVariationController::class, 'destroy']);
    });

    Route::middleware('permission:manage-inventory')->prefix('inventory')->group(function () {
        Route::get('/', [InventoryController::class, 'index']);
        Route::get('low-stock', [InventoryController::class, 'lowStock']);
        Route::get('out-of-stock', [InventoryController::class, 'outOfStock']);
        Route::get('{inventory}/history', [InventoryController::class, 'history']);
        Route::post('{inventory}/increase', [InventoryController::class, 'increase']);
        Route::post('{inventory}/decrease', [InventoryController::class, 'decrease']);
        Route::post('{inventory}/set', [InventoryController::class, 'setQuantity']);
    });

    Route::middleware('permission:manage-orders')->group(function () {
        Route::get('orders', [AdminOrderController::class, 'index']);
        Route::get('orders/{order}', [AdminOrderController::class, 'show']);
        Route::put('orders/{order}/status', [AdminOrderController::class, 'updateStatus']);
        Route::put('orders/{order}/payment-status', [AdminOrderController::class, 'updatePaymentStatus']);
        Route::post('orders/{order}/cancel', [AdminOrderController::class, 'cancel']);
        Route::get('orders/{order}/invoice', [AdminOrderController::class, 'invoice']);
    });

    Route::middleware('permission:manage-coupons')->group(function () {
        Route::apiResource('coupons', AdminCouponController::class);
        Route::patch('coupons/{coupon}/toggle-status', [AdminCouponController::class, 'toggleStatus']);
    });

    Route::middleware('permission:manage-reviews')->group(function () {
        Route::get('reviews', [AdminReviewController::class, 'index']);
        Route::patch('reviews/{review}/approve', [AdminReviewController::class, 'approve']);
        Route::patch('reviews/{review}/reject', [AdminReviewController::class, 'reject']);
        Route::delete('reviews/{review}', [AdminReviewController::class, 'destroy']);
    });

    Route::middleware('permission:manage-settings')->group(function () {
        Route::get('settings', [AdminSettingController::class, 'index']);
        Route::put('settings', [AdminSettingController::class, 'update']);
        Route::post('settings/logo', [AdminSettingController::class, 'uploadLogo']);
        Route::post('settings/favicon', [AdminSettingController::class, 'uploadFavicon']);

        Route::apiResource('shipping-zones', ShippingZoneController::class, ['parameters' => ['shipping-zones' => 'zone']])
            ->except(['show']);
    });

    Route::middleware('permission:manage-admins')->group(function () {
        Route::apiResource('users', AdminUserController::class)->except(['destroy']);
        Route::patch('users/{user}/toggle-status', [AdminUserController::class, 'toggleStatus']);
        Route::get('roles', [AdminUserController::class, 'roles']);
    });
});
