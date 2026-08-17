<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_guest_can_add_a_product_to_the_cart(): void
    {
        $product = $this->createProductWithStock(10);

        $response = $this->withHeaders(['X-Cart-Token' => 'guest-token-1'])
            ->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 2]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.items.0.quantity', 2)
            ->assertJsonPath('data.subtotal', (float) $product->price * 2);
    }

    public function test_cart_quantity_updates_and_accumulates_for_the_same_product(): void
    {
        $product = $this->createProductWithStock(10);
        $headers = ['X-Cart-Token' => 'guest-token-2'];

        $this->withHeaders($headers)->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 2]);
        $response = $this->withHeaders($headers)->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 3]);

        $response->assertOk()->assertJsonPath('data.items.0.quantity', 5);
    }

    public function test_adding_more_than_available_stock_is_rejected(): void
    {
        $product = $this->createProductWithStock(5);

        $response = $this->withHeaders(['X-Cart-Token' => 'guest-token-3'])
            ->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 10]);

        $response->assertStatus(422)->assertJsonPath('success', false);
    }

    public function test_updating_cart_item_quantity_beyond_stock_is_rejected(): void
    {
        $product = $this->createProductWithStock(5);
        $headers = ['X-Cart-Token' => 'guest-token-4'];

        $this->withHeaders($headers)->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 2]);
        $cart = $this->withHeaders($headers)->getJson('/api/cart')->json('data');
        $itemId = $cart['items'][0]['id'];

        $response = $this->withHeaders($headers)->putJson("/api/cart/items/{$itemId}", ['quantity' => 999]);

        $response->assertStatus(422);
    }

    public function test_removing_a_cart_item(): void
    {
        $product = $this->createProductWithStock(5);
        $headers = ['X-Cart-Token' => 'guest-token-5'];

        $this->withHeaders($headers)->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 1]);
        $cart = $this->withHeaders($headers)->getJson('/api/cart')->json('data');
        $itemId = $cart['items'][0]['id'];

        $response = $this->withHeaders($headers)->deleteJson("/api/cart/items/{$itemId}");

        $response->assertOk()->assertJsonCount(0, 'data.items');
    }
}
