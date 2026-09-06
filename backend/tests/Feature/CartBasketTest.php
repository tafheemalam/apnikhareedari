<?php

namespace Tests\Feature;

use App\Models\Basket;
use App\Models\CartBasket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartBasketTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_guest_can_start_a_basket_instance(): void
    {
        $basket = Basket::factory()->create(['amount' => 500]);

        $response = $this->withHeaders(['X-Cart-Token' => 'guest-basket-1'])
            ->postJson('/api/cart/baskets', ['basket_id' => $basket->id]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data.basket_instances')
            ->assertJsonPath('data.basket_instances.0.amount', '500.00')
            ->assertJsonPath('data.basket_instances.0.remaining_amount', 500);
    }

    public function test_an_authenticated_customer_can_start_a_basket_instance(): void
    {
        $customer = User::factory()->create();
        $basket = Basket::factory()->create(['amount' => 1000]);

        $response = $this->actingAs($customer)->postJson('/api/cart/baskets', ['basket_id' => $basket->id]);

        $response->assertOk()->assertJsonCount(1, 'data.basket_instances');
    }

    public function test_adding_an_item_that_fits_the_budget_succeeds(): void
    {
        $customer = User::factory()->create();
        $basket = Basket::factory()->create(['amount' => 500]);
        $product = $this->createProductWithStock(10, ['price' => 200, 'sale_price' => null]);

        $cartBasketId = $this->actingAs($customer)
            ->postJson('/api/cart/baskets', ['basket_id' => $basket->id])
            ->json('data.basket_instances.0.id');

        $response = $this->actingAs($customer)->postJson("/api/cart/baskets/{$cartBasketId}/items", [
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.basket_instances.0.filled_amount', 400)
            ->assertJsonPath('data.basket_instances.0.remaining_amount', 100)
            // The basket line still bills the fixed amount, not the sum of its contents.
            ->assertJsonPath('data.subtotal', 500);
    }

    public function test_adding_an_item_that_would_exceed_the_budget_is_blocked(): void
    {
        $customer = User::factory()->create();
        $basket = Basket::factory()->create(['amount' => 500]);
        $product = $this->createProductWithStock(10, ['price' => 600, 'sale_price' => null]);

        $cartBasketId = $this->actingAs($customer)
            ->postJson('/api/cart/baskets', ['basket_id' => $basket->id])
            ->json('data.basket_instances.0.id');

        $response = $this->actingAs($customer)->postJson("/api/cart/baskets/{$cartBasketId}/items", [
            'product_id' => $product->id,
            'quantity' => 1,
        ]);

        $response->assertStatus(422)->assertJsonPath('success', false);
        $this->assertDatabaseCount('cart_basket_items', 0);
    }

    public function test_removing_an_item_and_removing_a_whole_instance(): void
    {
        $customer = User::factory()->create();
        $basket = Basket::factory()->create(['amount' => 500]);
        $product = $this->createProductWithStock(10, ['price' => 200, 'sale_price' => null]);

        $cartBasketId = $this->actingAs($customer)
            ->postJson('/api/cart/baskets', ['basket_id' => $basket->id])
            ->json('data.basket_instances.0.id');
        $itemId = $this->actingAs($customer)
            ->postJson("/api/cart/baskets/{$cartBasketId}/items", ['product_id' => $product->id, 'quantity' => 1])
            ->json('data.basket_instances.0.items.0.id');

        $this->actingAs($customer)->deleteJson("/api/cart/baskets/{$cartBasketId}/items/{$itemId}")
            ->assertOk()->assertJsonPath('data.basket_instances.0.filled_amount', 0);

        $this->actingAs($customer)->deleteJson("/api/cart/baskets/{$cartBasketId}")
            ->assertOk()->assertJsonCount(0, 'data.basket_instances');
    }

    public function test_two_separate_basket_instances_coexist_as_distinct_rows(): void
    {
        $customer = User::factory()->create();
        $basket = Basket::factory()->create(['amount' => 500]);

        $this->actingAs($customer)->postJson('/api/cart/baskets', ['basket_id' => $basket->id]);
        $response = $this->actingAs($customer)->postJson('/api/cart/baskets', ['basket_id' => $basket->id]);

        $response->assertOk()->assertJsonCount(2, 'data.basket_instances');
        $this->assertEquals(2, CartBasket::count());
    }

    public function test_guest_to_user_login_reparents_basket_rows_without_collapsing_them(): void
    {
        $basket = Basket::factory()->create(['amount' => 500]);
        $customer = User::factory()->create(['email' => 'ayesha@example.com', 'password' => bcrypt('Password123')]);
        $headers = ['X-Cart-Token' => 'guest-basket-merge'];

        $this->withHeaders($headers)->postJson('/api/cart/baskets', ['basket_id' => $basket->id]);
        $this->withHeaders($headers)->postJson('/api/cart/baskets', ['basket_id' => $basket->id]);

        $this->withHeaders($headers)->postJson('/api/auth/login', [
            'email' => 'ayesha@example.com',
            'password' => 'Password123',
        ])->assertOk();

        $response = $this->actingAs($customer)->getJson('/api/cart');

        $response->assertOk()->assertJsonCount(2, 'data.basket_instances');
    }
}
