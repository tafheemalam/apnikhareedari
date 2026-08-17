<?php

namespace App\Providers;

use App\Models\Address;
use App\Models\Order;
use App\Models\ProductReview;
use App\Policies\AddressPolicy;
use App\Policies\OrderPolicy;
use App\Policies\ProductReviewPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Order::class, OrderPolicy::class);
        Gate::policy(Address::class, AddressPolicy::class);
        Gate::policy(ProductReview::class, ProductReviewPolicy::class);
    }
}
