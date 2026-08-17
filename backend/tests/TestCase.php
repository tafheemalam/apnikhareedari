<?php

namespace Tests;

use App\Models\Product;
use App\Models\User;
use App\Services\InventoryService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Spatie\Permission\PermissionRegistrar;

abstract class TestCase extends BaseTestCase
{
    protected function createAdmin(array $roles = ['Super Admin']): User
    {
        // Spatie caches the role/permission map in memory; RefreshDatabase wipes
        // the tables between tests without clearing that cache, so a stale map
        // from a previous test can make a freshly-seeded role look empty here.
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->seed(RolesAndPermissionsSeeder::class);

        $user = User::factory()->create();
        $user->syncRoles($roles);

        return $user;
    }

    protected function createProductWithStock(int $quantity = 20, array $attributes = []): Product
    {
        $product = Product::factory()->create($attributes);

        app(InventoryService::class)->initialize($product, null, $quantity);

        return $product->fresh();
    }
}
