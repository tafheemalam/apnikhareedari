<?php

namespace Tests\Feature;

use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
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

    public function test_cart_shows_the_selected_variations_own_image_not_the_products_default(): void
    {
        Storage::fake('public');
        $admin = $this->createAdmin();
        $category = Category::factory()->create();

        $product = $this->actingAs($admin)->post('/api/admin/products', [
            'category_id' => $category->id,
            'name' => 'Variant T-Shirt',
            'sku' => 'TSHIRT-VAR-003',
            'price' => 2000,
            'has_variations' => true,
            'status' => true,
            'images' => [UploadedFile::fake()->image('default.jpg', 900, 900)],
        ])->assertCreated()->json('data');

        $variation = $this->actingAs($admin)->post("/api/admin/products/{$product['id']}/variations", [
            'sku' => 'TSHIRT-VAR-003-RED',
            'quantity' => 10,
            'options' => [['attribute_name' => 'Color', 'attribute_value' => 'Red']],
            // Different dimensions than the product photo above, so the fake
            // image generator produces genuinely different bytes — otherwise
            // the dedup feature would (correctly) treat them as one image.
            'image' => UploadedFile::fake()->image('red.jpg', 700, 700),
        ])->assertCreated()->json('data');

        $this->assertNotSame($product['images'][0]['url'], $variation['image_url']);

        $response = $this->withHeaders(['X-Cart-Token' => 'guest-token-6'])->postJson('/api/cart/items', [
            'product_id' => $product['id'],
            'product_variation_id' => $variation['id'],
            'quantity' => 1,
        ]);

        $response->assertOk()->assertJsonPath('data.items.0.product.image_url', $variation['image_url']);
    }

    public function test_cart_falls_back_to_the_products_video_when_it_has_no_photos(): void
    {
        $product = $this->createProductWithStock(10, ['video' => 'products/99/video/demo.mp4']);

        $response = $this->withHeaders(['X-Cart-Token' => 'guest-token-7'])->postJson('/api/cart/items', [
            'product_id' => $product->id,
            'quantity' => 1,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.items.0.product.image_url', null)
            ->assertJsonPath('data.items.0.product.video_url', fn ($url) => str_contains($url, 'products/99/video/demo.mp4'));
    }

    public function test_a_note_can_be_added_when_adding_to_cart_and_updated_afterward(): void
    {
        $product = $this->createProductWithStock(10);
        $headers = ['X-Cart-Token' => 'guest-token-8'];

        $this->withHeaders($headers)->postJson('/api/cart/items', [
            'product_id' => $product->id,
            'quantity' => 1,
            'note' => 'Please gift wrap this one',
        ])->assertOk()->assertJsonPath('data.items.0.note', 'Please gift wrap this one');

        $itemId = $this->withHeaders($headers)->getJson('/api/cart')->json('data.items.0.id');

        $response = $this->withHeaders($headers)->putJson("/api/cart/items/{$itemId}", [
            'quantity' => 1,
            'note' => 'Actually, no wrapping needed',
        ]);

        $response->assertOk()->assertJsonPath('data.items.0.note', 'Actually, no wrapping needed');
    }
}
