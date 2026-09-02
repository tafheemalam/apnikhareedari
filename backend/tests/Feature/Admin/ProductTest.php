<?php

namespace Tests\Feature\Admin;

use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProductTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_a_product_with_an_uploaded_image(): void
    {
        Storage::fake('public');
        $admin = $this->createAdmin();
        $category = Category::factory()->create();

        $response = $this->actingAs($admin)->post('/api/admin/products', [
            'category_id' => $category->id,
            'name' => 'Wireless Earbuds',
            'sku' => 'EARBUD-002',
            'price' => 3500,
            'stock_quantity' => 25,
            'status' => true,
            'images' => [UploadedFile::fake()->image('earbuds.jpg', 2000, 1500)],
        ]);

        $response->assertCreated()->assertJsonPath('success', true);

        $product = \App\Models\Product::where('sku', 'EARBUD-002')->firstOrFail();
        $this->assertCount(1, $product->images);
        Storage::disk('public')->assertExists($product->images->first()->image);
    }

    public function test_admin_can_upload_a_webp_product_image(): void
    {
        Storage::fake('public');
        $admin = $this->createAdmin();
        $category = Category::factory()->create();

        $response = $this->actingAs($admin)->post('/api/admin/products', [
            'category_id' => $category->id,
            'name' => 'Webp Product',
            'sku' => 'WEBP-002',
            'price' => 1500,
            'stock_quantity' => 10,
            'status' => true,
            'images' => [UploadedFile::fake()->image('photo.webp', 1200, 900)],
        ]);

        $response->assertCreated()->assertJsonPath('success', true);

        $product = \App\Models\Product::where('sku', 'WEBP-002')->firstOrFail();
        Storage::disk('public')->assertExists($product->images->first()->image);
    }

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

    public function test_admin_can_create_a_product_with_variations_and_no_stock_quantity(): void
    {
        $admin = $this->createAdmin();
        $category = Category::factory()->create();

        $response = $this->actingAs($admin)->postJson('/api/admin/products', [
            'category_id' => $category->id,
            'name' => 'Variant T-Shirt',
            'sku' => 'TSHIRT-VAR-001',
            'price' => 2000,
            'has_variations' => true,
            'status' => true,
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.has_variations', true);

        $this->assertDatabaseHas('products', ['sku' => 'TSHIRT-VAR-001', 'has_variations' => true]);
        $this->assertDatabaseMissing('inventory', ['product_id' => \App\Models\Product::where('sku', 'TSHIRT-VAR-001')->value('id')]);
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

    public function test_admin_cannot_create_a_product_in_a_category_that_has_subcategories(): void
    {
        $admin = $this->createAdmin();
        $parent = Category::factory()->create();
        Category::factory()->create(['parent_id' => $parent->id]);

        $response = $this->actingAs($admin)->postJson('/api/admin/products', [
            'category_id' => $parent->id,
            'name' => 'Wireless Earbuds',
            'sku' => 'EARBUD-003',
            'price' => 3500,
            'stock_quantity' => 25,
        ]);

        $response->assertStatus(422)->assertJsonPath('success', false);
        $this->assertDatabaseMissing('products', ['sku' => 'EARBUD-003']);
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
