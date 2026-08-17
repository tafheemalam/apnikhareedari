<?php

namespace Database\Factories;

use App\Models\Address;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Address>
 */
class AddressFactory extends Factory
{
    protected $model = Address::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'label' => 'Home',
            'full_name' => fake()->name(),
            'phone' => fake()->numerify('03#########'),
            'address_line' => fake()->streetAddress(),
            'city' => fake()->randomElement(['Karachi', 'Lahore', 'Islamabad']),
            'area' => fake()->citySuffix(),
            'postal_code' => fake()->postcode(),
            'is_default' => true,
        ];
    }
}
