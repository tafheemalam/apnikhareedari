<?php

namespace Database\Factories;

use App\Models\Basket;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Basket>
 */
class BasketFactory extends Factory
{
    protected $model = Basket::class;

    public function definition(): array
    {
        return [
            'name' => 'Rs. '.fake()->randomElement([500, 1000, 1500]).' Basket',
            'amount' => fake()->randomElement([500, 1000, 1500]),
            'status' => true,
        ];
    }
}
