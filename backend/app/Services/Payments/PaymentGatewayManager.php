<?php

namespace App\Services\Payments;

use App\Contracts\PaymentGatewayInterface;
use App\Models\Setting;
use RuntimeException;

class PaymentGatewayManager
{
    /**
     * @var array<string, class-string<PaymentGatewayInterface>>
     */
    protected array $gateways = [
        'cod' => CodGateway::class,
        'mock' => MockGateway::class,
    ];

    public function isOnlinePaymentEnabled(): bool
    {
        return (bool) Setting::get('payment.online_enabled', false);
    }

    public function isCodEnabled(): bool
    {
        return (bool) Setting::get('payment.cod_enabled', true);
    }

    public function cod(): PaymentGatewayInterface
    {
        return $this->resolve('cod');
    }

    public function activeOnlineGateway(): PaymentGatewayInterface
    {
        return $this->resolve(Setting::get('payment.active_gateway', 'mock'));
    }

    public function resolve(string $identifier): PaymentGatewayInterface
    {
        if (! isset($this->gateways[$identifier])) {
            throw new RuntimeException("Unknown payment gateway [{$identifier}].");
        }

        return app($this->gateways[$identifier]);
    }
}
