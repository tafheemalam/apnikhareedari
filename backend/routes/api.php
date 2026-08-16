<?php

use App\Http\Controllers\Api\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Api\Admin\InventoryController;
use App\Http\Controllers\Api\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Api\Admin\ProductVariationController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Auth\ProfileController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
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

Route::middleware('auth:sanctum')->group(function () {
    Route::put('profile', [ProfileController::class, 'update']);
    Route::put('profile/password', [ProfileController::class, 'changePassword']);
});

// Public storefront catalog
Route::get('categories', [CategoryController::class, 'index']);
Route::get('categories/{category:slug}', [CategoryController::class, 'show']);
Route::get('products', [ProductController::class, 'index']);
Route::get('products/{product:slug}', [ProductController::class, 'show']);

// Admin-only routes
Route::prefix('admin')->name('admin.')->middleware(['auth:sanctum'])->group(function () {
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
});
