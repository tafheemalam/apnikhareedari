<?php

namespace Tests\Feature;

use App\Models\Basket;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\User;
use App\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class BasketCheckoutTest extends TestCase
{
    use RefreshDatabase;

    protected function checkoutPayload(array $overrides = []): array
    {
        return array_merge([
            'shipping_full_name' => 'Bilal Tariq',
            'shipping_phone' => '03001234567',
            'shipping_address' => 'House 1, Gulshan',
            'shipping_city' => 'Karachi',
            'payment_method' => 'cod',
        ], $overrides);
    }

    protected function fillBasket(User $customer, Basket $basket, array $products): int
    {
        $instances = $this->actingAs($customer)
            ->postJson('/api/cart/baskets', ['basket_id' => $basket->id])
            ->json('data.basket_instances');
        $cartBasketId = collect($instances)->max('id');

        foreach ($products as [$product, $quantity]) {
            $this->actingAs($customer)->postJson("/api/cart/baskets/{$cartBasketId}/items", [
                'product_id' => $product->id,
                'quantity' => $quantity,
            ])->assertOk();
        }

        return $cartBasketId;
    }

    public function test_checkout_bills_the_baskets_fixed_amount_not_the_sum_of_its_contents(): void
    {
        Notification::fake();
        $customer = User::factory()->create();
        $basket = Basket::factory()->create(['amount' => 500]);
        $product = $this->createProductWithStock(10, ['price' => 480, 'sale_price' => null]);
        $this->fillBasket($customer, $basket, [[$product, 1]]);

        $response = $this->actingAs($customer)->postJson('/api/checkout', $this->checkoutPayload());

        $response->assertCreated()->assertJsonPath('data.subtotal', '500.00');

        $order = Order::first();
        $this->assertEquals(500, (float) $order->items->first()->price);
        $this->assertEquals($basket->id, $order->items->first()->basket_id);
    }

    public function test_stock_is_decremented_for_every_product_inside_a_basket(): void
    {
        Notification::fake();
        $customer = User::factory()->create();
        $basket = Basket::factory()->create(['amount' => 1000]);
        $productA = $this->createProductWithStock(10, ['price' => 300, 'sale_price' => null]);
        $productB = $this->createProductWithStock(10, ['price' => 200, 'sale_price' => null]);
        $this->fillBasket($customer, $basket, [[$productA, 1], [$productB, 2]]);

        $this->actingAs($customer)->postJson('/api/checkout', $this->checkoutPayload())->assertCreated();

        $this->assertEquals(9, Inventory::where('product_id', $productA->id)->value('quantity'));
        $this->assertEquals(8, Inventory::where('product_id', $productB->id)->value('quantity'));
    }

    public function test_checkout_is_blocked_when_a_basket_products_stock_becomes_insufficient(): void
    {
        $customer = User::factory()->create();
        $basket = Basket::factory()->create(['amount' => 500]);
        $product = $this->createProductWithStock(1, ['price' => 400, 'sale_price' => null]);
        $this->fillBasket($customer, $basket, [[$product, 1]]);

        // Simulate another customer buying the last unit between fill-time and checkout.
        app(InventoryService::class)->decrease($product, null, 1, 'sale');

        $response = $this->actingAs($customer)->postJson('/api/checkout', $this->checkoutPayload());

        $response->assertStatus(422)->assertJsonPath('success', false);
        $this->assertDatabaseCount('orders', 0);
    }

    public function test_checkout_is_blocked_when_basket_contents_drift_over_budget(): void
    {
        $customer = User::factory()->create();
        $basket = Basket::factory()->create(['amount' => 500]);
        $product = $this->createProductWithStock(10, ['price' => 400, 'sale_price' => null]);
        $this->fillBasket($customer, $basket, [[$product, 1]]);

        // A price hike after the item was added pushes the basket's contents over budget.
        $product->update(['price' => 600]);

        $response = $this->actingAs($customer)->postJson('/api/checkout', $this->checkoutPayload());

        $response->assertStatus(422)->assertJsonPath('success', false);
        $this->assertDatabaseCount('orders', 0);
    }

    public function test_checkout_is_blocked_when_a_basket_instance_is_left_empty(): void
    {
        $customer = User::factory()->create();
        $basket = Basket::factory()->create(['amount' => 500]);
        $this->actingAs($customer)->postJson('/api/cart/baskets', ['basket_id' => $basket->id]);

        $response = $this->actingAs($customer)->postJson('/api/checkout', $this->checkoutPayload());

        $response->assertStatus(422)->assertJsonPath('success', false);
        $this->assertDatabaseCount('orders', 0);
    }

    public function test_multiple_baskets_and_regular_products_all_contribute_to_the_order_total(): void
    {
        Notification::fake();
        $customer = User::factory()->create();
        $basketA = Basket::factory()->create(['amount' => 500]);
        $basketB = Basket::factory()->create(['amount' => 1000]);
        $basketProductA = $this->createProductWithStock(10, ['price' => 400, 'sale_price' => null]);
        $basketProductB = $this->createProductWithStock(10, ['price' => 900, 'sale_price' => null]);
        $regularProduct = $this->createProductWithStock(10, ['price' => 250, 'sale_price' => null]);

        $this->fillBasket($customer, $basketA, [[$basketProductA, 1]]);
        $this->fillBasket($customer, $basketB, [[$basketProductB, 1]]);
        $this->actingAs($customer)->postJson('/api/cart/items', ['product_id' => $regularProduct->id, 'quantity' => 1]);

        $response = $this->actingAs($customer)->postJson('/api/checkout', $this->checkoutPayload());

        // 500 + 1000 + 250 = 1750
        $response->assertCreated()->assertJsonPath('data.subtotal', '1750.00');
    }
}
