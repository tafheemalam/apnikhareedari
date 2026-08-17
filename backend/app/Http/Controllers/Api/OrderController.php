<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderCancellationService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class OrderController extends Controller
{
    public function __construct(protected OrderCancellationService $cancellationService) {}

    public function index(Request $request): JsonResponse
    {
        $orders = $request->user()->orders()
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->latest('placed_at')
            ->paginate($request->integer('per_page', 10));

        return $this->success($orders->through(fn ($order) => new OrderResource($order)));
    }

    public function show(Request $request, string $orderNumber): JsonResponse
    {
        $order = Order::where('order_number', $orderNumber)->firstOrFail();
        $this->authorize('view', $order);

        $order->load('items.product', 'payments');

        return $this->success(new OrderResource($order));
    }

    public function cancel(Request $request, string $orderNumber): JsonResponse
    {
        $order = Order::where('order_number', $orderNumber)->firstOrFail();
        $this->authorize('cancel', $order);

        $order = $this->cancellationService->cancel($order, $request->user(), $request->input('reason'));

        return $this->success(new OrderResource($order->load('items.product', 'payments')), 'Order cancelled successfully');
    }

    public function invoice(Request $request, string $orderNumber): Response
    {
        $order = Order::where('order_number', $orderNumber)->firstOrFail();
        $this->authorize('view', $order);

        $order->load('items');
        $pdf = Pdf::loadView('invoices.order', ['order' => $order]);

        return $pdf->download("invoice-{$order->order_number}.pdf");
    }
}
