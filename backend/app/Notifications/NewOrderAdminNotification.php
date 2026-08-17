<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewOrderAdminNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(protected Order $order) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("New Order Received - {$this->order->order_number}")
            ->greeting('New order received')
            ->line("Order **{$this->order->order_number}** was just placed by {$this->order->shipping_full_name}.")
            ->line('Payment method: '.strtoupper($this->order->payment_method))
            ->line('Total: PKR '.number_format((float) $this->order->total, 2))
            ->action('View in Admin Panel', rtrim(config('app.frontend_url'), '/')."/admin/orders/{$this->order->id}");
    }
}
