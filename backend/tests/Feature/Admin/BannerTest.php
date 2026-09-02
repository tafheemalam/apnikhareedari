<?php

namespace Tests\Feature\Admin;

use App\Models\Banner;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BannerTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_a_banner_with_an_uploaded_image(): void
    {
        Storage::fake('public');
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->post('/api/admin/banners', [
            'title' => 'Summer Sale',
            'link_url' => '/shop',
            'image' => UploadedFile::fake()->image('banner.jpg', 1600, 600),
        ]);

        $response->assertCreated()->assertJsonPath('success', true)->assertJsonPath('data.title', 'Summer Sale');

        $banner = Banner::firstOrFail();
        Storage::disk('public')->assertExists($banner->image);
    }

    public function test_banner_creation_requires_an_image(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->postJson('/api/admin/banners', ['title' => 'No Image']);

        $response->assertStatus(422);
    }

    public function test_public_listing_only_returns_active_banners_in_sort_order(): void
    {
        $first = Banner::factory()->create(['status' => true, 'sort_order' => 2]);
        $second = Banner::factory()->create(['status' => true, 'sort_order' => 1]);
        Banner::factory()->create(['status' => false, 'sort_order' => 0]);

        $response = $this->getJson('/api/banners');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertEquals([$second->id, $first->id], $ids->all());
    }

    public function test_a_regular_customer_cannot_manage_banners(): void
    {
        $customer = User::factory()->create();

        $response = $this->actingAs($customer)->postJson('/api/admin/banners', ['title' => 'Nope']);

        $response->assertStatus(403);
    }

    public function test_admin_can_toggle_and_delete_a_banner(): void
    {
        Storage::fake('public');
        $admin = $this->createAdmin();
        $banner = Banner::factory()->create(['status' => true]);

        $this->actingAs($admin)->patchJson("/api/admin/banners/{$banner->id}/toggle-status")
            ->assertOk()->assertJsonPath('data.status', false);

        $this->actingAs($admin)->deleteJson("/api/admin/banners/{$banner->id}")->assertOk();
        $this->assertDatabaseMissing('banners', ['id' => $banner->id]);
    }
}
