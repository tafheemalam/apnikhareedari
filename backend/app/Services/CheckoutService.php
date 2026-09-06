<?php

namespace App\Services;

use App\Models\Address;
use App\Models\Cart;
use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Setting;
use App\Models\User;
use App\Notifications\NewOrderAdminNotification;
use App\Notifications\OrderPlacedNotification;
use App\Notifications\PaymentFailureAdminNotification;
use App\Services\Payments\PaymentGatewayManager;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use RuntimeException;

class CheckoutService
{
    public function __construct(
        protected InventoryService $inventoryService,
        protected ShippingService $shippingService,
        protected PaymentGatewayManager $gateways,
        protected BasketService $basketService,
    ) {}

    /**
     * @throws RuntimeException on stock, coupon, or payment failure — caller should render a 422.
     */
    public function process(Cart $cart, array $data, User $user): Order
    {
        $cart->loadMissing('items.product', 'items.variation', 'basketInstances.items.product', 'basketInstances.items.variation');

        $filledBaskets = $cart->basketInstances->filter(fn ($cb) => $cb->items->isNotEmpty());

        if ($cart->items->isEmpty() && $filledBaskets->isEmpty()) {
            throw new RuntimeException('Your cart is empty.');
        }

        if ($data['payment_method'] === 'cod' && ! $this->gateways->isCodEnabled()) {
            throw new RuntimeException('Cash on Delivery is currently unavailable.');
        }

        if ($data['payment_method'] === 'online' && ! $this->gateways->isOnlinePaymentEnabled()) {
            throw new RuntimeException('Online payment is currently unavailable.');
        }

        // Re-validate stock at checkout time (spec rule #6), on top of the check at add-to-cart time.
        foreach ($cart->items as $item) {
            if (! $this->inventoryService->hasAvailableStock($item->product, $item->variation, $item->quantity)) {
                throw new RuntimeException("\"{$item->product->name}\" no longer has enough stock available.");
            }
        }

        foreach ($filledBaskets as $cartBasket) {
            $this->basketService->assertFillIsValid($cartBasket);
        }

        $shippingFields = $this->resolveShippingFields($data, $user);
        $subtotal = round(
            (float) $cart->items->sum(fn ($item) => $item->quantity * (float) $item->unit_price)
                + (float) $filledBaskets->sum(fn ($cartBasket) => (float) $cartBasket->amount),
            2
        );

        $coupon = null;
        $discount = 0.0;

        if (! empty($data['coupon_code'])) {
            $coupon = Coupon::where('code', strtoupper($data['coupon_code']))->first();

            if (! $coupon || ! $coupon->isValidFor($subtotal)) {
                throw new RuntimeException('The applied coupon is no longer valid.');
            }

            $discount = $coupon->calculateDiscount($subtotal);
        }

        $shipping = $this->shippingService->calculate($shippingFields['shipping_city'], $subtotal - $discount);
        $tax = Setting::get('tax.enabled', false)
            ? round(($subtotal - $discount) * ((float) Setting::get('tax.percentage', 0) / 100), 2)
            : 0.0;

        $total = round($subtotal - $discount + $shipping['amount'] + $tax, 2);

        return DB::transaction(function () use ($cart, $data, $user, $shippingFields, $subtotal, $discount, $coupon, $shipping, $tax, $total, $filledBaskets) {
            $order = Order::create(array_merge($shippingFields, [
                'order_number' => $this->generateOrderNumber(),
                'user_id' => $user->id,
                'coupon_id' => $coupon?->id,
                'status' => 'pending',
                'payment_method' => $data['payment_method'],
                'payment_status' => 'pending',
                'subtotal' => $subtotal,
                'discount_amount' => $discount,
                'shipping_amount' => $shipping['amount'],
                'tax_amount' => $tax,
                'total' => $total,
                'delivery_notes' => $data['delivery_notes'] ?? null,
                'placed_at' => now(),
            ]));

            foreach ($cart->items as $item) {
                $order->items()->create([
                    'product_id' => $item->product_id,
                    'product_variation_id' => $item->product_variation_id,
                    'product_name' => $item->product->name,
                    'variation_label' => $item->variation?->label,
                    'sku' => $item->variation?->sku ?? $item->product->sku,
                    'price' => $item->unit_price,
                    'quantity' => $item->quantity,
                    'line_total' => $item->line_total,
                ]);

                $this->inventoryService->decrease(
                    $item->product,
                    $item->variation,
                    $item->quantity,
                    'sale',
                    referenceType: 'order',
                    referenceId: $order->id,
                    actor: $user,
                );
            }

            foreach ($filledBaskets as $cartBasket) {
                $orderItem = $order->items()->create([
                    'product_id' => null,
                    'product_variation_id' => null,
                    'basket_id' => $cartBasket->basket_id,
                    'product_name' => $cartBasket->basket_name,
                    'variation_label' => null,
                    'sku' => 'BASKET-'.$cartBasket->id,
                    'price' => $cartBasket->amount,
                    'quantity' => 1,
                    'line_total' => $cartBasket->amount,
                ]);

                foreach ($cartBasket->items as $basketItem) {
                    $orderItem->basketItems()->create([
                        'product_id' => $basketItem->product_id,
                        'product_variation_id' => $basketItem->product_variation_id,
                        'product_name' => $basketItem->product->name,
                        'variation_label' => $basketItem->variation?->label,
                        'sku' => $basketItem->variation?->sku ?? $basketItem->product->sku,
                        'quantity' => $basketItem->quantity,
                        'unit_price' => $basketItem->unit_price,
                    ]);

                    $this->inventoryService->decrease(
                        $basketItem->product,
                        $basketItem->variation,
                        $basketItem->quantity,
                        'sale',
                        referenceType: 'order',
                        referenceId: $order->id,
                        actor: $user,
                    );
                }
            }

            if ($coupon) {
                $coupon->increment('used_count');
                CouponUsage::create([
                    'coupon_id' => $coupon->id,
                    'user_id' => $user->id,
                    'order_id' => $order->id,
                    'discount_amount' => $discount,
                ]);
            }

            $this->capturePayment($order, $data['payment_method']);

            $cart->items()->delete();
            $cart->basketInstances()->delete();

            return $order->fresh(['items.basketItems', 'payments']);
        });
    }

    protected function capturePayment(Order $order, string $method): void
    {
        $gateway = $method === 'cod' ? $this->gateways->cod() : $this->gateways->activeOnlineGateway();
        $result = $gateway->charge($order);

        if ($method === 'online' && ! $result->success) {
            Notification::route('mail', Setting::get('store.email', config('mail.from.address')))
                ->notify(new PaymentFailureAdminNotification($order, $result->message ?? 'Payment declined'));

            throw new RuntimeException($result->message ?? 'Payment failed. Please try again.');
        }

        Payment::create([
            'order_id' => $order->id,
            'gateway' => $gateway->identifier(),
            'transaction_id' => $result->transactionId,
            'amount' => $order->total,
            'currency' => 'PKR',
            'status' => $result->status,
            'gateway_response' => $result->gatewayResponse,
            'paid_at' => $result->status === 'paid' ? now() : null,
        ]);

        if ($result->status === 'paid') {
            $order->update(['payment_status' => 'paid', 'status' => 'confirmed']);
        }
    }

    protected function resolveShippingFields(array $data, User $user): array
    {
        if (! empty($data['address_id'])) {
            $address = Address::findOrFail($data['address_id']);

            if ($address->user_id !== $user->id) {
                throw new RuntimeException('The selected address does not belong to your account.');
            }

            return [
                'shipping_full_name' => $address->full_name,
                'shipping_phone' => $address->phone,
                'shipping_email' => $user->email,
                'shipping_address' => $address->address_line,
                'shipping_city' => $address->city,
                'shipping_area' => $address->area,
                'shipping_postal_code' => $address->postal_code,
                'billing_same_as_shipping' => true,
                'billing_full_name' => null,
                'billing_phone' => null,
                'billing_address' => null,
                'billing_city' => null,
                'billing_area' => null,
                'billing_postal_code' => null,
            ];
        }

        $billingSame = (bool) ($data['billing_same_as_shipping'] ?? true);

        return [
            'shipping_full_name' => $data['shipping_full_name'],
            'shipping_phone' => $data['shipping_phone'],
            'shipping_email' => $data['shipping_email'] ?? $user->email,
            'shipping_address' => $data['shipping_address'],
            'shipping_city' => $data['shipping_city'],
            'shipping_area' => $data['shipping_area'] ?? null,
            'shipping_postal_code' => $data['shipping_postal_code'] ?? null,
            'billing_same_as_shipping' => $billingSame,
            'billing_full_name' => $billingSame ? null : $data['billing_full_name'],
            'billing_phone' => $billingSame ? null : $data['billing_phone'],
            'billing_address' => $billingSame ? null : $data['billing_address'],
            'billing_city' => $billingSame ? null : $data['billing_city'],
            'billing_area' => $billingSame ? null : ($data['billing_area'] ?? null),
            'billing_postal_code' => $billingSame ? null : ($data['billing_postal_code'] ?? null),
        ];
    }

    protected function generateOrderNumber(): string
    {
        $date = now()->format('Ymd');
        $countToday = Order::whereDate('placed_at', now()->toDateString())->lockForUpdate()->count();

        return sprintf('ORD-%s-%06d', $date, $countToday + 1);
    }

    public function sendPlacementNotifications(Order $order): void
    {
        if ($order->user) {
            $order->user->notify(new OrderPlacedNotification($order));
        } elseif ($order->shipping_email) {
            Notification::route('mail', $order->shipping_email)->notify(new OrderPlacedNotification($order));
        }

        $admins = User::whereHas('roles', fn ($q) => $q->whereIn('name', ['Super Admin', 'Admin', 'Order Manager']))->get();

        if ($admins->isNotEmpty()) {
            Notification::send($admins, new NewOrderAdminNotification($order));
        }
    }
}
