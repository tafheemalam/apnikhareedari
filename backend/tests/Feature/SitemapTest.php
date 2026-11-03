<?php

namespace Tests\Feature;

use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SitemapTest extends TestCase
{
    use RefreshDatabase;

    public function test_sitemap_lists_active_categories_and_products_as_xml(): void
    {
        $category = Category::factory()->create(['slug' => 'electronics', 'status' => true]);
        $inactiveCategory = Category::factory()->create(['slug' => 'discontinued', 'status' => false]);
        $product = $this->createProductWithStock(10, ['name' => 'Smartphone X', 'slug' => 'smartphone-x', 'category_id' => $category->id, 'status' => true]);
        $inactiveProduct = $this->createProductWithStock(10, ['slug' => 'hidden-product', 'category_id' => $category->id, 'status' => false]);

        $response = $this->get('/api/sitemap.xml');

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/xml; charset=UTF-8');

        $xml = $response->getContent();
        $this->assertStringContainsString('<loc>'.config('app.frontend_url').'/categories/electronics</loc>', $xml);
        $this->assertStringContainsString('<loc>'.config('app.frontend_url').'/products/smartphone-x</loc>', $xml);
        $this->assertStringNotContainsString('/categories/discontinued', $xml);
        $this->assertStringNotContainsString('/products/hidden-product', $xml);
    }
}
