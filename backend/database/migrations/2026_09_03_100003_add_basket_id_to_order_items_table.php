<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            // Marks a null-product_id row as a basket line item (as opposed to a row whose
            // product was later deleted) so OrderCancellationService can tell them apart.
            $table->foreignId('basket_id')->nullable()->after('product_variation_id')->constrained('baskets')->nullOnDelete();
            $table->index('basket_id');
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('basket_id');
        });
    }
};
