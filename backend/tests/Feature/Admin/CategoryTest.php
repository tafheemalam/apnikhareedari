<?php

namespace Tests\Feature\Admin;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_a_category(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->postJson('/api/admin/categories', [
            'name' => 'Electronics',
            'status' => true,
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Electronics')
            ->assertJsonPath('data.slug', 'electronics');

        $this->assertDatabaseHas('categories', ['name' => 'Electronics', 'slug' => 'electronics']);
    }

    public function test_admin_can_create_a_subcategory(): void
    {
        $admin = $this->createAdmin();
        $parent = Category::factory()->create(['name' => 'Electronics']);

        $response = $this->actingAs($admin)->postJson('/api/admin/categories', [
            'name' => 'Mobile Phones',
            'parent_id' => $parent->id,
        ]);

        $response->assertCreated()->assertJsonPath('data.parent_id', $parent->id);
    }

    public function test_category_with_products_cannot_be_deleted(): void
    {
        $admin = $this->createAdmin();
        $category = Category::factory()->create();
        $this->createProductWithStock(10, ['category_id' => $category->id]);

        $response = $this->actingAs($admin)->deleteJson("/api/admin/categories/{$category->id}");

        $response->assertStatus(422)->assertJsonPath('success', false);
        $this->assertDatabaseHas('categories', ['id' => $category->id]);
    }

    public function test_a_regular_customer_cannot_create_categories(): void
    {
        $customer = User::factory()->create();

        $response = $this->actingAs($customer)->postJson('/api/admin/categories', [
            'name' => 'Electronics',
        ]);

        $response->assertStatus(403);
    }

    public function test_guests_cannot_create_categories(): void
    {
        $response = $this->postJson('/api/admin/categories', ['name' => 'Electronics']);

        $response->assertStatus(401);
    }
}
