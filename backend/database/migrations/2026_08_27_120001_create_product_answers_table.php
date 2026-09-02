<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_question_id')->constrained('product_questions')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->text('answer');
            $table->boolean('is_seller_answer')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->index('product_question_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_answers');
    }
};
