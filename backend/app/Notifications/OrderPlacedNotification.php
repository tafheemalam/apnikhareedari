<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderPlacedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(protected Order $order) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject("Order Confirmation - {$this->order->order_number}")
            ->greeting("Thank you for your order, {$this->order->shipping_full_name}!")
            ->line("Your order **{$this->order->order_number}** has been placed successfully.")
            ->line('Payment method: '.strtoupper($this->order->payment_method))
            ->line('Order total: PKR '.number_format((float) $this->order->total, 2));

        foreach ($this->order->items as $item) {
            $mail->line("- {$item->product_name}".($item->variation_label ? " ({$item->variation_label})" : '')." x{$item->quantity} = PKR ".number_format((float) $item->line_total, 2));
        }

        return $mail
            ->action('View Order', rtrim(config('app.frontend_url'), '/')."/orders/{$this->order->order_number}")
            ->line('We will notify you as your order status changes.');
    }
}
