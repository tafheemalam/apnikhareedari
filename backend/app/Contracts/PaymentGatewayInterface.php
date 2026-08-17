<?php

namespace App\Contracts;

use App\Models\Order;
use App\Models\Payment;
use App\ValueObjects\PaymentResult;

interface PaymentGatewayInterface
{
    /**
     * Unique machine-readable identifier for this gateway (stored on the payments table).
     */
    public function identifier(): string;

    /**
     * Charge the given order and return the outcome. Implementations must never
     * accept or persist raw card numbers/CVV — only gateway-issued references.
     */
    public function charge(Order $order, array $payload = []): PaymentResult;

    /**
     * Re-check the current status of a previously initiated payment with the gateway.
     */
    public function verify(string $transactionId): PaymentResult;

    /**
     * Refund a previously captured payment, fully or partially.
     */
    public function refund(Payment $payment, ?float $amount = null): PaymentResult;
}
