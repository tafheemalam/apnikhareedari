<?php

namespace Tests\Feature;

use App\Models\Coupon;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\Setting;
use App\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class CheckoutTest extends TestCase
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

    public function test_guest_can_place_a_cod_order_and_stock_is_deducted(): void
    {
        Notification::fake();
        $product = $this->createProductWithStock(10);
        $headers = ['X-Cart-Token' => 'checkout-token-1'];

        $this->withHeaders($headers)->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 3]);

        $response = $this->withHeaders($headers)->postJson('/api/checkout', $this->checkoutPayload());

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.payment_method', 'cod')
            ->assertJsonPath('data.payment_status', 'pending')
            ->assertJsonPath('data.status', 'pending');

        $orderNumber = $response->json('data.order_number');
        $this->assertMatchesRegularExpression('/^ORD-\d{8}-\d{6}$/', $orderNumber);

        $inventory = Inventory::where('product_id', $product->id)->first();
        $this->assertEquals(7, $inventory->quantity);

        // Cart is emptied after a successful order.
        $cart = $this->withHeaders($headers)->getJson('/api/cart')->json('data');
        $this->assertCount(0, $cart['items']);
    }

    public function test_checkout_fails_when_stock_is_insufficient_at_checkout_time(): void
    {
        $product = $this->createProductWithStock(1);
        $headers = ['X-Cart-Token' => 'checkout-token-2'];

        $this->withHeaders($headers)->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 1]);

        // Simulate another customer buying the last unit between add-to-cart and checkout.
        app(InventoryService::class)->decrease($product, null, 1, 'sale');

        $response = $this->withHeaders($headers)->postJson('/api/checkout', $this->checkoutPayload());

        $response->assertStatus(422)->assertJsonPath('success', false);
        $this->assertDatabaseCount('orders', 0);
    }

    public function test_online_payment_via_mock_gateway_confirms_the_order_as_paid(): void
    {
        Notification::fake();
        Setting::set('payment.online_enabled', '1', 'payment');

        $product = $this->createProductWithStock(10);
        $headers = ['X-Cart-Token' => 'checkout-token-3'];
        $this->withHeaders($headers)->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 1]);

        $response = $this->withHeaders($headers)->postJson('/api/checkout', $this->checkoutPayload(['payment_method' => 'online']));

        $response->assertCreated()
            ->assertJsonPath('data.payment_status', 'paid')
            ->assertJsonPath('data.status', 'confirmed')
            ->assertJsonPath('data.payments.0.gateway', 'mock');
    }

    public function test_online_payment_is_rejected_when_disabled(): void
    {
        Setting::set('payment.online_enabled', '0', 'payment');

        $product = $this->createProductWithStock(10);
        $headers = ['X-Cart-Token' => 'checkout-token-4'];
        $this->withHeaders($headers)->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 1]);

        $response = $this->withHeaders($headers)->postJson('/api/checkout', $this->checkoutPayload(['payment_method' => 'online']));

        $response->assertStatus(422)->assertJsonPath('success', false);
    }

    public function test_a_valid_coupon_discounts_the_order_total(): void
    {
        Notification::fake();
        $product = $this->createProductWithStock(10, ['price' => 4000, 'sale_price' => null]);
        Coupon::create([
            'code' => 'SAVE10', 'type' => 'percentage', 'value' => 10,
            'minimum_order_amount' => 1000, 'status' => true, 'used_count' => 0,
        ]);

        $headers = ['X-Cart-Token' => 'checkout-token-5'];
        $this->withHeaders($headers)->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 1]);

        $response = $this->withHeaders($headers)->postJson('/api/checkout', $this->checkoutPayload(['coupon_code' => 'save10']));

        $response->assertCreated()->assertJsonPath('data.discount_amount', '400.00');
        $this->assertEquals(1, Coupon::where('code', 'SAVE10')->value('used_count'));
    }

    public function test_product_price_is_snapshotted_on_the_order_item(): void
    {
        Notification::fake();
        $product = $this->createProductWithStock(10, ['price' => 1000, 'sale_price' => null]);
        $headers = ['X-Cart-Token' => 'checkout-token-6'];
        $this->withHeaders($headers)->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 1]);
        $this->withHeaders($headers)->postJson('/api/checkout', $this->checkoutPayload());

        // Price changes after the order should not affect the historical order item.
        $product->update(['price' => 5000]);

        $order = Order::first();
        $this->assertEquals(1000, (float) $order->items->first()->price);
    }
}
