<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class GuestAccountCreatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(protected string $email, protected string $password) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Your '.config('app.name').' account details')
            ->greeting("Hi {$notifiable->name},")
            ->line('Thanks for your order! We\'ve created an account for you so you can track this order and any future ones.')
            ->line("Email: {$this->email}")
            ->line("Password: {$this->password}")
            ->action('Log In', config('app.frontend_url').'/login')
            ->line('We recommend changing this password after you log in.');
    }
}
