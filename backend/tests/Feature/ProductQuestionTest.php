<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\ProductQuestion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductQuestionTest extends TestCase
{
    use RefreshDatabase;

    public function test_anyone_can_view_approved_questions_for_a_product(): void
    {
        $product = Product::factory()->create();
        $customer = User::factory()->create();
        ProductQuestion::create([
            'product_id' => $product->id,
            'user_id' => $customer->id,
            'question' => 'Does this come with a warranty?',
            'status' => 'approved',
        ]);

        $response = $this->getJson("/api/products/{$product->id}/questions");

        $response->assertOk()->assertJsonCount(1, 'data.data');
    }

    public function test_rejected_questions_are_not_publicly_visible(): void
    {
        $product = Product::factory()->create();
        $customer = User::factory()->create();
        ProductQuestion::create([
            'product_id' => $product->id,
            'user_id' => $customer->id,
            'question' => 'Spammy question here',
            'status' => 'rejected',
        ]);

        $response = $this->getJson("/api/products/{$product->id}/questions");

        $response->assertOk()->assertJsonCount(0, 'data.data');
    }

    public function test_a_guest_cannot_ask_a_question(): void
    {
        $product = Product::factory()->create();

        $response = $this->postJson("/api/products/{$product->id}/questions", [
            'question' => 'Is this available in blue?',
        ]);

        $response->assertStatus(401);
    }

    public function test_an_authenticated_customer_can_ask_a_question(): void
    {
        $product = Product::factory()->create();
        $customer = User::factory()->create();

        $response = $this->actingAs($customer)->postJson("/api/products/{$product->id}/questions", [
            'question' => 'Is this available in blue?',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.question', 'Is this available in blue?')
            ->assertJsonPath('data.status', 'approved')
            ->assertJsonPath('data.customer_name', $customer->name);

        $this->assertDatabaseHas('product_questions', ['product_id' => $product->id, 'user_id' => $customer->id]);
    }

    public function test_a_question_shorter_than_five_characters_is_rejected(): void
    {
        $product = Product::factory()->create();
        $customer = User::factory()->create();

        $response = $this->actingAs($customer)->postJson("/api/products/{$product->id}/questions", [
            'question' => 'Hi?',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('question');
    }

    public function test_any_authenticated_customer_can_answer_a_question(): void
    {
        $product = Product::factory()->create();
        $asker = User::factory()->create();
        $answerer = User::factory()->create();
        $question = ProductQuestion::create([
            'product_id' => $product->id,
            'user_id' => $asker->id,
            'question' => 'Does it come with a charger?',
            'status' => 'approved',
        ]);

        $response = $this->actingAs($answerer)->postJson("/api/questions/{$question->id}/answers", [
            'answer' => 'Yes, a charger is included in the box.',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.answer', 'Yes, a charger is included in the box.')
            ->assertJsonPath('data.is_seller_answer', false);
    }

    public function test_an_admins_answer_is_flagged_as_a_seller_answer(): void
    {
        $product = Product::factory()->create();
        $asker = User::factory()->create();
        $admin = $this->createAdmin();
        $question = ProductQuestion::create([
            'product_id' => $product->id,
            'user_id' => $asker->id,
            'question' => 'Does it come with a charger?',
            'status' => 'approved',
        ]);

        $response = $this->actingAs($admin)->postJson("/api/questions/{$question->id}/answers", [
            'answer' => 'Yes, from the official store.',
        ]);

        $response->assertCreated()->assertJsonPath('data.is_seller_answer', true);
    }

    public function test_a_regular_customer_cannot_access_admin_question_moderation(): void
    {
        $product = Product::factory()->create();
        $customer = User::factory()->create();
        $question = ProductQuestion::create([
            'product_id' => $product->id,
            'user_id' => $customer->id,
            'question' => 'Some question here',
            'status' => 'approved',
        ]);

        $this->actingAs($customer)->getJson('/api/admin/questions')->assertStatus(403);
        $this->actingAs($customer)->deleteJson("/api/admin/questions/{$question->id}")->assertStatus(403);
    }

    public function test_admin_can_reject_and_delete_a_question(): void
    {
        $product = Product::factory()->create();
        $customer = User::factory()->create();
        $admin = $this->createAdmin();
        $question = ProductQuestion::create([
            'product_id' => $product->id,
            'user_id' => $customer->id,
            'question' => 'Some question here',
            'status' => 'approved',
        ]);

        $this->actingAs($admin)->patchJson("/api/admin/questions/{$question->id}/reject")
            ->assertOk()->assertJsonPath('data.status', 'rejected');

        $this->actingAs($admin)->deleteJson("/api/admin/questions/{$question->id}")->assertOk();
        $this->assertSoftDeleted('product_questions', ['id' => $question->id]);
    }
}
