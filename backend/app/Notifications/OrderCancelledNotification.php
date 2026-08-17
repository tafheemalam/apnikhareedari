<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderCancelledNotification extends Notification
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
            ->subject("Order {$this->order->order_number} Cancelled")
            ->greeting("Hi {$this->order->shipping_full_name},")
            ->line("Your order **{$this->order->order_number}** has been cancelled.")
            ->when($this->order->payment_status === 'paid', fn ($mail) => $mail->line('Your payment will be refunded shortly.'))
            ->line('If you did not request this cancellation, please contact our support team.');
    }
}
