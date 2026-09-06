<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cart_baskets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cart_id')->constrained('carts')->cascadeOnDelete();
            $table->foreignId('basket_id')->nullable()->constrained('baskets')->nullOnDelete();

            // Snapshot of the basket's name/price at the moment the customer started filling it,
            // so a later admin price change never retroactively changes a price already locked in.
            $table->string('basket_name');
            $table->decimal('amount', 10, 2);

            $table->timestamps();

            $table->index('cart_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cart_baskets');
    }
};
