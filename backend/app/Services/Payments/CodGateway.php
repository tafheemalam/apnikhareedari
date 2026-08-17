<?php

namespace App\Services\Payments;

use App\Contracts\PaymentGatewayInterface;
use App\Models\Order;
use App\Models\Payment;
use App\ValueObjects\PaymentResult;

/**
 * Cash on Delivery is not a real payment gateway, but it satisfies the same
 * interface so checkout logic never has to special-case the payment method.
 */
class CodGateway implements PaymentGatewayInterface
{
    public function identifier(): string
    {
        return 'cod';
    }

    public function charge(Order $order, array $payload = []): PaymentResult
    {
        return new PaymentResult(
            success: true,
            status: 'pending',
            transactionId: null,
            message: 'Cash on Delivery order placed; payment collected upon delivery.',
        );
    }

    public function verify(string $transactionId): PaymentResult
    {
        return new PaymentResult(success: false, status: 'failed', message: 'COD payments cannot be verified remotely.');
    }

    public function refund(Payment $payment, ?float $amount = null): PaymentResult
    {
        return new PaymentResult(success: true, status: 'refunded', message: 'COD refunds are handled manually.');
    }
}
