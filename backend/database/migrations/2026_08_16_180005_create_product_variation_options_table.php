<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_variation_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_variation_id')->constrained('product_variations')->cascadeOnDelete();
            $table->string('attribute_name');
            $table->string('attribute_value');
            $table->timestamps();

            $table->unique(['product_variation_id', 'attribute_name'], 'variation_attribute_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_variation_options');
    }
};
