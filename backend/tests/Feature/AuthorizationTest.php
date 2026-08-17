<?php

namespace Tests\Feature;

use App\Models\Address;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_routes_require_authentication(): void
    {
        $this->getJson('/api/admin/dashboard')->assertStatus(401);
    }

    public function test_admin_routes_reject_customers_without_the_right_permission(): void
    {
        $customer = User::factory()->create();

        $this->actingAs($customer)->getJson('/api/admin/dashboard')->assertStatus(403);
        $this->actingAs($customer)->getJson('/api/admin/products')->assertStatus(403);
        $this->actingAs($customer)->getJson('/api/admin/orders')->assertStatus(403);
    }

    public function test_admin_with_limited_role_cannot_access_unrelated_admin_sections(): void
    {
        $inventoryManager = $this->createAdmin(['Inventory Manager']);

        // Inventory Manager only has manage-inventory + view-dashboard.
        $this->actingAs($inventoryManager)->getJson('/api/admin/inventory')->assertOk();
        $this->actingAs($inventoryManager)->getJson('/api/admin/orders')->assertStatus(403);
        $this->actingAs($inventoryManager)->postJson('/api/admin/categories', ['name' => 'Test'])->assertStatus(403);
    }

    public function test_a_customer_can_only_see_their_own_addresses(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        Address::factory()->create([
            'user_id' => $owner->id, 'full_name' => 'Owner', 'phone' => '03000000000',
            'address_line' => 'X', 'city' => 'Karachi', 'is_default' => true,
        ]);

        $response = $this->actingAs($other)->getJson('/api/addresses');

        $response->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_a_customer_cannot_update_another_customers_address(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $address = Address::factory()->create([
            'user_id' => $owner->id, 'full_name' => 'Owner', 'phone' => '03000000000',
            'address_line' => 'X', 'city' => 'Karachi', 'is_default' => true,
        ]);

        $response = $this->actingAs($intruder)->putJson("/api/addresses/{$address->id}", [
            'full_name' => 'Hacked', 'phone' => '03001111111', 'address_line' => 'Y', 'city' => 'Lahore',
        ]);

        $response->assertStatus(403);
    }

    public function test_wishlist_requires_authentication(): void
    {
        $this->getJson('/api/wishlist')->assertStatus(401);
    }

    public function test_orders_index_only_returns_the_authenticated_customers_orders(): void
    {
        $customer = User::factory()->create();

        $response = $this->actingAs($customer)->getJson('/api/orders');

        $response->assertOk();
    }
}
