<?php

namespace Tests\Feature\Admin;

use App\Models\Inventory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_increase_stock(): void
    {
        $admin = $this->createAdmin();
        $product = $this->createProductWithStock(10);
        $inventory = Inventory::where('product_id', $product->id)->first();

        $response = $this->actingAs($admin)->postJson("/api/admin/inventory/{$inventory->id}/increase", [
            'quantity' => 15,
            'type' => 'purchase',
        ]);

        $response->assertOk()->assertJsonPath('data.quantity', 25);
        $this->assertDatabaseHas('inventory_transactions', [
            'product_id' => $product->id,
            'type' => 'purchase',
            'quantity' => 15,
            'previous_quantity' => 10,
            'new_quantity' => 25,
        ]);
    }

    public function test_admin_can_decrease_stock(): void
    {
        $admin = $this->createAdmin();
        $product = $this->createProductWithStock(10);
        $inventory = Inventory::where('product_id', $product->id)->first();

        $response = $this->actingAs($admin)->postJson("/api/admin/inventory/{$inventory->id}/decrease", [
            'quantity' => 4,
            'type' => 'damage',
        ]);

        $response->assertOk()->assertJsonPath('data.quantity', 6);
    }

    public function test_decreasing_more_than_available_stock_is_rejected(): void
    {
        $admin = $this->createAdmin();
        $product = $this->createProductWithStock(3);
        $inventory = Inventory::where('product_id', $product->id)->first();

        $response = $this->actingAs($admin)->postJson("/api/admin/inventory/{$inventory->id}/decrease", [
            'quantity' => 10,
            'type' => 'damage',
        ]);

        $response->assertStatus(422)->assertJsonPath('success', false);
        $this->assertEquals(3, $inventory->fresh()->quantity);
    }

    public function test_admin_can_manually_set_stock(): void
    {
        $admin = $this->createAdmin();
        $product = $this->createProductWithStock(10);
        $inventory = Inventory::where('product_id', $product->id)->first();

        $response = $this->actingAs($admin)->postJson("/api/admin/inventory/{$inventory->id}/set", [
            'quantity' => 50,
            'notes' => 'Stock count correction',
        ]);

        $response->assertOk()->assertJsonPath('data.quantity', 50);
    }

    public function test_low_stock_endpoint_returns_items_at_or_below_threshold(): void
    {
        $admin = $this->createAdmin();
        $lowStock = $this->createProductWithStock(2);
        Inventory::where('product_id', $lowStock->id)->update(['low_stock_threshold' => 5]);
        $healthyStock = $this->createProductWithStock(50);
        Inventory::where('product_id', $healthyStock->id)->update(['low_stock_threshold' => 5]);

        $response = $this->actingAs($admin)->getJson('/api/admin/inventory/low-stock');

        $response->assertOk();
        $productIds = collect($response->json('data'))->pluck('product_id');
        $this->assertTrue($productIds->contains($lowStock->id));
        $this->assertFalse($productIds->contains($healthyStock->id));
    }
}
