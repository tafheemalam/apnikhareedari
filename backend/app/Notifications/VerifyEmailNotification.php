<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VerifyEmailNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(protected string $verifyUrl) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Verify Your Email Address')
            ->greeting("Hi {$notifiable->name},")
            ->line('Please confirm this is your email address to finish setting up your account.')
            ->action('Verify Email Address', $this->verifyUrl)
            ->line('This verification link will expire in 60 minutes.')
            ->line('You need to verify your email before you can place an order.')
            ->line('If you did not create an account, no further action is required.');
    }
}
