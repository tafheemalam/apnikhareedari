<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        $name = fake()->unique()->words(3, true);
        $price = fake()->randomFloat(2, 500, 50000);

        return [
            'category_id' => Category::factory(),
            'name' => ucfirst($name),
            'slug' => Str::slug($name).'-'.fake()->unique()->numberBetween(1000, 999999),
            'sku' => strtoupper(Str::random(4)).'-'.fake()->unique()->numberBetween(1000, 999999),
            'short_description' => fake()->sentence(),
            'description' => fake()->paragraph(),
            'price' => $price,
            'sale_price' => null,
            'cost_price' => round($price * 0.7, 2),
            'has_variations' => false,
            'status' => true,
            'featured' => false,
            'new_arrival' => false,
            'best_seller' => false,
        ];
    }
}
