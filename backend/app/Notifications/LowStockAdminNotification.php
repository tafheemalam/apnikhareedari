<?php

namespace App\Notifications;

use App\Models\Inventory;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LowStockAdminNotification extends Notification
{
    use Queueable;

    public function __construct(protected Inventory $inventory) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $label = $this->inventory->product->name.($this->inventory->variation ? " ({$this->inventory->variation->label})" : '');
        $isOut = $this->inventory->quantity <= 0;

        return (new MailMessage)
            ->subject($isOut ? "Out of Stock: {$label}" : "Low Stock: {$label}")
            ->greeting($isOut ? 'A product just ran out of stock' : 'A product is running low on stock')
            ->line("**{$label}** now has {$this->inventory->quantity} unit(s) remaining (threshold: {$this->inventory->low_stock_threshold}).")
            ->action('Manage Inventory', rtrim(config('app.frontend_url'), '/').'/admin/inventory');
    }
}
