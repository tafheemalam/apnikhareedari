<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_products_can_be_searched_by_name(): void
    {
        $this->createProductWithStock(10, ['name' => 'Wireless Bluetooth Earbuds', 'slug' => 'wireless-bluetooth-earbuds']);
        $this->createProductWithStock(10, ['name' => 'Leather Formal Shoes', 'slug' => 'leather-formal-shoes']);

        $response = $this->getJson('/api/products?search=Earbuds');

        $response->assertOk();
        $names = collect($response->json('data.data'))->pluck('name');
        $this->assertTrue($names->contains('Wireless Bluetooth Earbuds'));
        $this->assertFalse($names->contains('Leather Formal Shoes'));
    }

    public function test_inactive_products_are_not_returned_publicly(): void
    {
        $this->createProductWithStock(10, ['name' => 'Hidden Product', 'status' => false]);

        $response = $this->getJson('/api/products?search=Hidden');

        $response->assertOk();
        $this->assertCount(0, $response->json('data.data'));
    }

    public function test_products_can_be_sorted_by_price(): void
    {
        $this->createProductWithStock(10, ['name' => 'Cheap Item', 'price' => 500]);
        $this->createProductWithStock(10, ['name' => 'Expensive Item', 'price' => 5000]);

        $response = $this->getJson('/api/products?sort=price_low_high');

        $response->assertOk();
        $prices = collect($response->json('data.data'))->pluck('price')->map(fn ($p) => (float) $p);
        $this->assertEquals($prices->sort()->values()->all(), $prices->values()->all());
    }
}
