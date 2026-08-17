<?php

namespace Database\Seeders;

use App\Models\Coupon;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use App\Services\InventoryService;
use App\Services\OrderCancellationService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SampleOrdersSeeder extends Seeder
{
    protected const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    public function run(): void
    {
        $customer = User::where('email', env('CUSTOMER_SEED_EMAIL', 'customer@apnikhareedari.pk'))->first();
        $products = Product::with('inventory')->whereDoesntHave('variations')->where('status', true)->inRandomOrder()->take(5)->get();

        if (! $customer || $products->isEmpty()) {
            return;
        }

        $inventoryService = app(InventoryService::class);
        $cancellationService = app(OrderCancellationService::class);

        foreach (self::STATUSES as $i => $status) {
            $product = $products[$i % $products->count()];
            $quantity = rand(1, 3);
            $price = (float) ($product->sale_price ?? $product->price);
            $subtotal = round($price * $quantity, 2);
            $shipping = $subtotal >= 3000 ? 0 : 200;
            $total = $subtotal + $shipping;

            $order = DB::transaction(function () use ($customer, $product, $quantity, $price, $subtotal, $shipping, $total, $status, $i, $inventoryService) {
                $order = Order::create([
                    'order_number' => sprintf('ORD-%s-SAMPLE%02d', now()->subDays(10 - $i)->format('Ymd'), $i + 1),
                    'user_id' => $customer->id,
                    'status' => 'pending',
                    'payment_method' => $i % 2 === 0 ? 'cod' : 'online',
                    'payment_status' => 'pending',
                    'subtotal' => $subtotal,
                    'discount_amount' => 0,
                    'shipping_amount' => $shipping,
                    'tax_amount' => 0,
                    'total' => $total,
                    'shipping_full_name' => $customer->name,
                    'shipping_phone' => $customer->phone ?? '03000000000',
                    'shipping_email' => $customer->email,
                    'shipping_address' => 'House 1, Sample Street',
                    'shipping_city' => 'Karachi',
                    'placed_at' => now()->subDays(10 - $i),
                ]);

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'sku' => $product->sku,
                    'price' => $price,
                    'quantity' => $quantity,
                    'line_total' => $subtotal,
                ]);

                $inventoryService->decrease($product, null, $quantity, 'sale', referenceType: 'order', referenceId: $order->id);

                $paymentStatus = $order->payment_method === 'online' ? 'paid' : 'pending';
                Payment::create([
                    'order_id' => $order->id,
                    'gateway' => $order->payment_method === 'online' ? 'mock' : 'cod',
                    'transaction_id' => $order->payment_method === 'online' ? 'MOCK-SAMPLE'.($i + 1) : null,
                    'amount' => $total,
                    'currency' => 'PKR',
                    'status' => $paymentStatus,
                    'paid_at' => $paymentStatus === 'paid' ? now()->subDays(10 - $i) : null,
                ]);

                $order->update(['payment_status' => $paymentStatus]);

                return $order;
            });

            if ($status === 'cancelled') {
                $cancellationService->cancel($order, null, 'Sample data: customer changed their mind');
            } else {
                $order->update(['status' => $status]);
            }
        }
    }
}
