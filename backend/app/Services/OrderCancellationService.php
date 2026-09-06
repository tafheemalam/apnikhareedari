<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use App\Notifications\OrderCancelledNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class OrderCancellationService
{
    public function __construct(protected InventoryService $inventoryService) {}

    public function cancel(Order $order, ?User $actor = null, ?string $reason = null): Order
    {
        DB::transaction(function () use ($order, $actor, $reason) {
            $order->loadMissing('items.product', 'items.variation', 'items.basketItems.product', 'items.basketItems.variation');

            foreach ($order->items as $item) {
                if ($item->basket_id) {
                    foreach ($item->basketItems as $basketItem) {
                        if (! $basketItem->product) {
                            continue;
                        }

                        $this->inventoryService->increase(
                            $basketItem->product,
                            $basketItem->variation,
                            $basketItem->quantity,
                            'cancellation',
                            referenceType: 'order',
                            referenceId: $order->id,
                            notes: $reason,
                            actor: $actor,
                        );
                    }

                    continue;
                }

                if (! $item->product) {
                    continue;
                }

                $this->inventoryService->increase(
                    $item->product,
                    $item->variation,
                    $item->quantity,
                    'cancellation',
                    referenceType: 'order',
                    referenceId: $order->id,
                    notes: $reason,
                    actor: $actor,
                );
            }

            $order->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
                'admin_notes' => $reason ? trim(($order->admin_notes ? $order->admin_notes."\n" : '').$reason) : $order->admin_notes,
            ]);
        });

        $order->refresh();

        if ($order->user) {
            $order->user->notify(new OrderCancelledNotification($order));
        } elseif ($order->shipping_email) {
            Notification::route('mail', $order->shipping_email)->notify(new OrderCancelledNotification($order));
        }

        return $order;
    }
}
