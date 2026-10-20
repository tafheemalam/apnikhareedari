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
        //
        // This raw ALTER is MySQL-specific syntax. The test suite runs against
        // SQLite, which has no real ENUM type — Laravel emulates `enum()` there
        // with a CHECK constraint that already accepts any string value we pass
        // at insert time once it's recreated, so there's nothing to widen.
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE orders MODIFY payment_method ENUM('cod', 'online', 'jazzcash', 'easypaisa') NOT NULL DEFAULT 'cod'");
        }
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE orders MODIFY payment_method ENUM('cod', 'online') NOT NULL DEFAULT 'cod'");
        }
    }
};
