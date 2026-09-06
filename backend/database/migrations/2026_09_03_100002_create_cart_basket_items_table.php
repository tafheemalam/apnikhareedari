<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cart_basket_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cart_basket_id')->constrained('cart_baskets')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('product_variation_id')->nullable()->constrained('product_variations')->cascadeOnDelete();
            $table->unsignedInteger('quantity');
            $table->timestamps();

            $table->unique(['cart_basket_id', 'product_id', 'product_variation_id'], 'cart_basket_items_unique_line');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cart_basket_items');
    }
};
