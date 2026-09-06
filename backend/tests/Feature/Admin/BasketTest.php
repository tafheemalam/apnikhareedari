<?php

namespace Tests\Feature\Admin;

use App\Models\Basket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BasketTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_a_basket(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->postJson('/api/admin/baskets', [
            'name' => 'Rs. 500 Basket',
            'amount' => 500,
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Rs. 500 Basket')
            ->assertJsonPath('data.amount', '500.00')
            ->assertJsonPath('data.status', true);

        $this->assertDatabaseHas('baskets', ['name' => 'Rs. 500 Basket', 'amount' => 500]);
    }

    public function test_basket_creation_requires_a_positive_amount(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->postJson('/api/admin/baskets', ['name' => 'No Amount', 'amount' => 0]);

        $response->assertStatus(422);
    }

    public function test_admin_can_update_a_basket(): void
    {
        $admin = $this->createAdmin();
        $basket = Basket::factory()->create(['name' => 'Old Name', 'amount' => 500]);

        $response = $this->actingAs($admin)->putJson("/api/admin/baskets/{$basket->id}", [
            'name' => 'New Name',
            'amount' => 1000,
        ]);

        $response->assertOk()->assertJsonPath('data.name', 'New Name')->assertJsonPath('data.amount', '1000.00');
    }

    public function test_admin_can_toggle_and_delete_a_basket(): void
    {
        $admin = $this->createAdmin();
        $basket = Basket::factory()->create(['status' => true]);

        $this->actingAs($admin)->patchJson("/api/admin/baskets/{$basket->id}/toggle-status")
            ->assertOk()->assertJsonPath('data.status', false);

        $this->actingAs($admin)->deleteJson("/api/admin/baskets/{$basket->id}")->assertOk();
        $this->assertDatabaseMissing('baskets', ['id' => $basket->id]);
    }

    public function test_a_regular_customer_cannot_manage_baskets(): void
    {
        $customer = User::factory()->create();

        $response = $this->actingAs($customer)->postJson('/api/admin/baskets', ['name' => 'Nope', 'amount' => 500]);

        $response->assertStatus(403);
    }

    public function test_public_listing_only_returns_active_baskets(): void
    {
        $active = Basket::factory()->create(['status' => true]);
        Basket::factory()->create(['status' => false]);

        $response = $this->getJson('/api/baskets');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertEquals([$active->id], $ids->all());
    }
}
