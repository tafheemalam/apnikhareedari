<?php

namespace Tests\Feature\Admin;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProductVariationGenerationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_generate_every_size_color_combination_at_once(): void
    {
        Storage::fake('public');
        $admin = $this->createAdmin();
        $category = Category::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id, 'sku' => 'HOOD-001']);

        $response = $this->actingAs($admin)->post("/api/admin/products/{$product->id}/variations/generate", [
            'sizes' => ['S', 'M', 'L'],
            'colors' => [
                ['name' => 'Red', 'image' => UploadedFile::fake()->image('red.jpg', 800, 800)],
                ['name' => 'Blue', 'image' => UploadedFile::fake()->image('blue.jpg', 800, 800)],
            ],
            'quantity' => 10,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.created_count', 6)
            ->assertJsonPath('data.skipped_count', 0);

        $product->refresh();
        $this->assertTrue($product->has_variations);
        $this->assertCount(6, $product->variations);

        // Each color's image is reused across all of its sizes rather than
        // uploaded separately per variation.
        $redImages = $product->variations()->get()->filter(
            fn ($v) => $v->options->firstWhere('attribute_value', 'Red')
        )->pluck('image')->unique();
        $this->assertCount(1, $redImages);
        Storage::disk('public')->assertExists($redImages->first());

        $this->assertDatabaseHas('inventory', ['product_id' => $product->id, 'quantity' => 10]);
    }

    public function test_generating_variations_skips_combinations_that_already_exist(): void
    {
        $admin = $this->createAdmin();
        $category = Category::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id, 'sku' => 'HOOD-002']);

        $this->actingAs($admin)->post("/api/admin/products/{$product->id}/variations", [
            'sku' => 'HOOD-002-RED-S',
            'quantity' => 5,
            'options' => [
                ['attribute_name' => 'Size', 'attribute_value' => 'S'],
                ['attribute_name' => 'Color', 'attribute_value' => 'Red'],
            ],
        ])->assertCreated();

        $response = $this->actingAs($admin)->post("/api/admin/products/{$product->id}/variations/generate", [
            'sizes' => ['S', 'M'],
            'colors' => [['name' => 'Red']],
            'quantity' => 10,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.created_count', 1)
            ->assertJsonPath('data.skipped_count', 1);

        $this->assertCount(2, $product->variations()->get());
    }

    public function test_generated_skus_stay_unique_when_sanitized_color_and_size_collide(): void
    {
        $admin = $this->createAdmin();
        $category = Category::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id, 'sku' => 'HOOD-003']);

        $response = $this->actingAs($admin)->post("/api/admin/products/{$product->id}/variations/generate", [
            'sizes' => ['M'],
            'colors' => [['name' => 'Red'], ['name' => 'Red!']],
            'quantity' => 5,
        ]);

        $response->assertCreated()->assertJsonPath('data.created_count', 2);

        $skus = $product->variations()->pluck('sku');
        $this->assertSame($skus->count(), $skus->unique()->count());
    }
}
