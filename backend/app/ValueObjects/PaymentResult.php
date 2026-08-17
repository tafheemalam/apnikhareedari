<?php

namespace App\ValueObjects;

class PaymentResult
{
    public function __construct(
        public readonly bool $success,
        public readonly string $status,
        public readonly ?string $transactionId = null,
        public readonly ?string $message = null,
        public readonly array $gatewayResponse = [],
    ) {}
}
