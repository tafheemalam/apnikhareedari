<?php

namespace Database\Factories;

use App\Models\Banner;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Banner>
 */
class BannerFactory extends Factory
{
    protected $model = Banner::class;

    public function definition(): array
    {
        return [
            'image' => 'banners/'.fake()->uuid().'.jpg',
            'title' => fake()->sentence(3),
            'link_url' => '/shop',
            'status' => true,
            'sort_order' => 0,
        ];
    }
}
