<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderStatusChangedNotification extends Notification
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
            ->subject("Order {$this->order->order_number} Update")
            ->greeting("Hi {$this->order->shipping_full_name},")
            ->line("Your order **{$this->order->order_number}** status has been updated to: **".ucfirst($this->order->status).'**.')
            ->action('View Order', rtrim(config('app.frontend_url'), '/')."/orders/{$this->order->order_number}");
    }
}
