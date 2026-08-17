<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice {{ $order->order_number }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #1f2937; }
        .header { display: flex; justify-content: space-between; margin-bottom: 24px; }
        h1 { font-size: 20px; margin: 0 0 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: left; }
        th { background: #f3f4f6; }
        .totals td { border: none; }
        .totals .label { text-align: right; font-weight: bold; }
        .muted { color: #6b7280; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1>{{ config('app.name') }}</h1>
            <div class="muted">Invoice for order {{ $order->order_number }}</div>
        </div>
        <div style="text-align: right;">
            <div><strong>Order Date:</strong> {{ $order->placed_at->format('d M Y') }}</div>
            <div><strong>Status:</strong> {{ ucfirst($order->status) }}</div>
            <div><strong>Payment:</strong> {{ strtoupper($order->payment_method) }} / {{ ucfirst($order->payment_status) }}</div>
        </div>
    </div>

    <div>
        <strong>Bill / Ship To:</strong><br>
        {{ $order->shipping_full_name }}<br>
        {{ $order->shipping_address }}, {{ $order->shipping_area }}<br>
        {{ $order->shipping_city }} {{ $order->shipping_postal_code }}<br>
        {{ $order->shipping_phone }}
    </div>

    <table>
        <thead>
            <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($order->items as $item)
                <tr>
                    <td>{{ $item->product_name }}{{ $item->variation_label ? ' ('.$item->variation_label.')' : '' }}</td>
                    <td>{{ $item->sku }}</td>
                    <td>{{ $item->quantity }}</td>
                    <td>PKR {{ number_format($item->price, 2) }}</td>
                    <td>PKR {{ number_format($item->line_total, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals" style="width: 300px; margin-left: auto;">
        <tr><td class="label">Subtotal</td><td>PKR {{ number_format($order->subtotal, 2) }}</td></tr>
        <tr><td class="label">Discount</td><td>-PKR {{ number_format($order->discount_amount, 2) }}</td></tr>
        <tr><td class="label">Shipping</td><td>PKR {{ number_format($order->shipping_amount, 2) }}</td></tr>
        <tr><td class="label">Tax</td><td>PKR {{ number_format($order->tax_amount, 2) }}</td></tr>
        <tr><td class="label"><strong>Grand Total</strong></td><td><strong>PKR {{ number_format($order->total, 2) }}</strong></td></tr>
    </table>
</body>
</html>
