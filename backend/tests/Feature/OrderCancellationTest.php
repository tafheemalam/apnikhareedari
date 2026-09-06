<?php

namespace Tests\Feature;

use App\Models\Basket;
use App\Models\Inventory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class OrderCancellationTest extends TestCase
{
    use RefreshDatabase;

    public function test_cancelling_an_order_restocks_every_product_inside_its_baskets(): void
    {
        Notification::fake();
        $customer = User::factory()->create();
        $basket = Basket::factory()->create(['amount' => 1000]);
        $productA = $this->createProductWithStock(10, ['price' => 300, 'sale_price' => null]);
        $productB = $this->createProductWithStock(10, ['price' => 200, 'sale_price' => null]);

        $cartBasketId = $this->actingAs($customer)
            ->postJson('/api/cart/baskets', ['basket_id' => $basket->id])
            ->json('data.basket_instances.0.id');
        $this->actingAs($customer)->postJson("/api/cart/baskets/{$cartBasketId}/items", ['product_id' => $productA->id, 'quantity' => 1]);
        $this->actingAs($customer)->postJson("/api/cart/baskets/{$cartBasketId}/items", ['product_id' => $productB->id, 'quantity' => 2]);

        $order = $this->actingAs($customer)->postJson('/api/checkout', [
            'shipping_full_name' => $customer->name,
            'shipping_phone' => '03001234567',
            'shipping_address' => 'House 1',
            'shipping_city' => 'Karachi',
            'payment_method' => 'cod',
        ])->json('data');

        $this->assertEquals(9, Inventory::where('product_id', $productA->id)->value('quantity'));
        $this->assertEquals(8, Inventory::where('product_id', $productB->id)->value('quantity'));

        $response = $this->actingAs($customer)->postJson("/api/orders/{$order['order_number']}/cancel");

        $response->assertOk()->assertJsonPath('data.status', 'cancelled');
        $this->assertEquals(10, Inventory::where('product_id', $productA->id)->value('quantity'));
        $this->assertEquals(10, Inventory::where('product_id', $productB->id)->value('quantity'));
    }

    public function test_a_customer_can_cancel_their_own_pending_order_and_stock_is_restored(): void
    {
        Notification::fake();
        $customer = User::factory()->create();
        $product = $this->createProductWithStock(10);

        $this->actingAs($customer)->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 4]);
        $order = $this->actingAs($customer)->postJson('/api/checkout', [
            'shipping_full_name' => $customer->name,
            'shipping_phone' => '03001234567',
            'shipping_address' => 'House 1',
            'shipping_city' => 'Karachi',
            'payment_method' => 'cod',
        ])->json('data');

        $this->assertEquals(6, Inventory::where('product_id', $product->id)->value('quantity'));

        $response = $this->actingAs($customer)->postJson("/api/orders/{$order['order_number']}/cancel");

        $response->assertOk()->assertJsonPath('data.status', 'cancelled');
        $this->assertEquals(10, Inventory::where('product_id', $product->id)->value('quantity'));
    }

    public function test_a_customer_cannot_cancel_another_customers_order(): void
    {
        Notification::fake();
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $product = $this->createProductWithStock(10);

        $this->actingAs($owner)->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 1]);
        $order = $this->actingAs($owner)->postJson('/api/checkout', [
            'shipping_full_name' => $owner->name,
            'shipping_phone' => '03001234567',
            'shipping_address' => 'House 1',
            'shipping_city' => 'Karachi',
            'payment_method' => 'cod',
        ])->json('data');

        $response = $this->actingAs($intruder, 'sanctum')->postJson("/api/orders/{$order['order_number']}/cancel");

        $response->assertStatus(403);
    }

    public function test_admin_can_cancel_any_order(): void
    {
        Notification::fake();
        $customer = User::factory()->create();
        $admin = $this->createAdmin();
        $product = $this->createProductWithStock(10);

        $this->actingAs($customer)->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 2]);
        $order = $this->actingAs($customer)->postJson('/api/checkout', [
            'shipping_full_name' => $customer->name,
            'shipping_phone' => '03001234567',
            'shipping_address' => 'House 1',
            'shipping_city' => 'Karachi',
            'payment_method' => 'cod',
        ])->json('data');

        $response = $this->actingAs($admin, 'sanctum')->postJson("/api/admin/orders/{$order['id']}/cancel");

        $response->assertOk()->assertJsonPath('data.status', 'cancelled');
        $this->assertEquals(10, Inventory::where('product_id', $product->id)->value('quantity'));
    }
}
