<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateOrderStatusRequest;
use App\Http\Requests\Admin\UpdatePaymentStatusRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Notifications\OrderStatusChangedNotification;
use App\Notifications\PaymentConfirmedNotification;
use App\Services\InventoryService;
use App\Services\OrderCancellationService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Notification;

class OrderController extends Controller
{
    public function __construct(
        protected OrderCancellationService $cancellationService,
        protected InventoryService $inventoryService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $orders = Order::query()
            ->with('user:id,name,email', 'items')
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = $request->string('search');
                $q->where(function ($sub) use ($term) {
                    $sub->where('order_number', 'like', "%{$term}%")
                        ->orWhere('shipping_full_name', 'like', "%{$term}%")
                        ->orWhere('shipping_phone', 'like', "%{$term}%");
                });
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->when($request->filled('payment_status'), fn ($q) => $q->where('payment_status', $request->input('payment_status')))
            ->when($request->filled('payment_method'), fn ($q) => $q->where('payment_method', $request->input('payment_method')))
            ->when($request->filled('from_date'), fn ($q) => $q->whereDate('placed_at', '>=', $request->input('from_date')))
            ->when($request->filled('to_date'), fn ($q) => $q->whereDate('placed_at', '<=', $request->input('to_date')))
            ->latest('placed_at')
            ->paginate($request->integer('per_page', 20));

        return $this->success($orders->through(fn ($order) => new OrderResource($order)));
    }

    public function show(Order $order): JsonResponse
    {
        $order->load('user:id,name,email', 'items.product', 'payments');

        return $this->success(new OrderResource($order));
    }

    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): JsonResponse
    {
        $newStatus = $request->validated('status');
        $previousStatus = $order->status;

        if ($newStatus === 'cancelled' && $order->isCancellable()) {
            $order = $this->cancellationService->cancel($order, $request->user());
        } else {
            $order->update(['status' => $newStatus]);

            if ($newStatus === 'returned' && ! in_array($previousStatus, ['cancelled', 'returned'], true)) {
                $order->loadMissing('items.product', 'items.variation');
                foreach ($order->items as $item) {
                    if ($item->product) {
                        $this->inventoryService->increase(
                            $item->product, $item->variation, $item->quantity, 'return',
                            referenceType: 'order', referenceId: $order->id, actor: $request->user(),
                        );
                    }
                }
            }

            $this->notifyStatusChange($order);
        }

        return $this->success(new OrderResource($order->load('items.product', 'payments')), 'Order status updated');
    }

    public function updatePaymentStatus(UpdatePaymentStatusRequest $request, Order $order): JsonResponse
    {
        $wasPaid = $order->payment_status === 'paid';
        $order->update(['payment_status' => $request->validated('payment_status')]);

        if (! $wasPaid && $order->payment_status === 'paid') {
            if ($order->user) {
                $order->user->notify(new PaymentConfirmedNotification($order));
            }
        }

        return $this->success(new OrderResource($order), 'Payment status updated');
    }

    public function cancel(Request $request, Order $order): JsonResponse
    {
        if (! $order->isCancellable()) {
            return $this->error('This order can no longer be cancelled', null, 422);
        }

        $order = $this->cancellationService->cancel($order, $request->user(), $request->input('reason'));

        return $this->success(new OrderResource($order->load('items.product', 'payments')), 'Order cancelled successfully');
    }

    public function invoice(Order $order): Response
    {
        $order->load('items');
        $pdf = Pdf::loadView('invoices.order', ['order' => $order]);

        return $pdf->download("invoice-{$order->order_number}.pdf");
    }

    protected function notifyStatusChange(Order $order): void
    {
        if ($order->user) {
            $order->user->notify(new OrderStatusChangedNotification($order));
        } elseif ($order->shipping_email) {
            Notification::route('mail', $order->shipping_email)->notify(new OrderStatusChangedNotification($order));
        }
    }
}
