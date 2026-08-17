<?php

namespace App\Services\Payments;

use App\Contracts\PaymentGatewayInterface;
use App\Models\Order;
use App\Models\Payment;
use App\ValueObjects\PaymentResult;
use Illuminate\Support\Str;

/**
 * A stand-in online gateway for local development and demos. It always
 * succeeds and never touches real money or card data. Swap in a real
 * implementation (Stripe/PayPal/JazzCash/etc.) behind PaymentGatewayInterface
 * when credentials are available — checkout logic does not need to change.
 */
class MockGateway implements PaymentGatewayInterface
{
    public function identifier(): string
    {
        return 'mock';
    }

    public function charge(Order $order, array $payload = []): PaymentResult
    {
        $transactionId = 'MOCK-'.strtoupper(Str::random(12));

        return new PaymentResult(
            success: true,
            status: 'paid',
            transactionId: $transactionId,
            message: 'Payment simulated successfully in the mock gateway.',
            gatewayResponse: [
                'gateway' => 'mock',
                'transaction_id' => $transactionId,
                'amount' => (float) $order->total,
                'currency' => 'PKR',
                'simulated' => true,
            ],
        );
    }

    public function verify(string $transactionId): PaymentResult
    {
        return new PaymentResult(
            success: true,
            status: 'paid',
            transactionId: $transactionId,
            message: 'Mock transaction verified.',
        );
    }

    public function refund(Payment $payment, ?float $amount = null): PaymentResult
    {
        return new PaymentResult(
            success: true,
            status: 'refunded',
            transactionId: $payment->transaction_id,
            message: 'Mock refund processed.',
        );
    }
}
