<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // The JazzCash/EasyPaisa checkout flow (CheckoutRequest, Checkout.jsx,
        // PaymentInstructions.jsx) was built against these values, but this
        // enum was never widened to accept them — every order placed with
        // either method failed at the database layer with a truncation error.
        DB::statement("ALTER TABLE orders MODIFY payment_method ENUM('cod', 'online', 'jazzcash', 'easypaisa') NOT NULL DEFAULT 'cod'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE orders MODIFY payment_method ENUM('cod', 'online') NOT NULL DEFAULT 'cod'");
    }
};
