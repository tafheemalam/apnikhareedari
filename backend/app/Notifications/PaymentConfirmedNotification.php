<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentConfirmedNotification extends Notification
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
            ->subject("Payment Received - {$this->order->order_number}")
            ->greeting("Hi {$this->order->shipping_full_name},")
            ->line("We've received your payment of PKR ".number_format((float) $this->order->total, 2)." for order **{$this->order->order_number}**.")
            ->action('View Order', rtrim(config('app.frontend_url'), '/')."/orders/{$this->order->order_number}");
    }
}
