<?php

namespace Tests\Feature\Admin;

use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_a_product_with_stock(): void
    {
        $admin = $this->createAdmin();
        $category = Category::factory()->create();

        $response = $this->actingAs($admin)->postJson('/api/admin/products', [
            'category_id' => $category->id,
            'name' => 'Wireless Earbuds',
            'sku' => 'EARBUD-001',
            'price' => 3500,
            'stock_quantity' => 25,
            'status' => true,
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.sku', 'EARBUD-001')
            ->assertJsonPath('data.stock_quantity', 25);

        $this->assertDatabaseHas('products', ['sku' => 'EARBUD-001', 'category_id' => $category->id]);
        $this->assertDatabaseHas('inventory', ['quantity' => 25]);
        $this->assertDatabaseHas('inventory_transactions', ['type' => 'adjustment', 'quantity' => 25]);
    }

    public function test_product_creation_requires_a_valid_category(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->postJson('/api/admin/products', [
            'category_id' => 999999,
            'name' => 'Wireless Earbuds',
            'sku' => 'EARBUD-001',
            'price' => 3500,
            'stock_quantity' => 25,
        ]);

        $response->assertStatus(422)->assertJsonPath('success', false);
    }

    public function test_a_regular_customer_cannot_create_products(): void
    {
        $customer = \App\Models\User::factory()->create();
        $category = Category::factory()->create();

        $response = $this->actingAs($customer)->postJson('/api/admin/products', [
            'category_id' => $category->id,
            'name' => 'Wireless Earbuds',
            'sku' => 'EARBUD-001',
            'price' => 3500,
            'stock_quantity' => 25,
        ]);

        $response->assertStatus(403);
    }
}
