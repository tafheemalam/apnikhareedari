<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipping_rates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shipping_zone_id')->constrained('shipping_zones')->cascadeOnDelete();
            $table->decimal('rate', 10, 2);
            $table->decimal('free_shipping_threshold', 10, 2)->nullable();
            $table->unsignedTinyInteger('estimated_delivery_days_min')->nullable();
            $table->unsignedTinyInteger('estimated_delivery_days_max')->nullable();
            $table->timestamps();

            $table->index('shipping_zone_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipping_rates');
    }
};
