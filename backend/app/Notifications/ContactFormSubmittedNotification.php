<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ContactFormSubmittedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        protected string $name,
        protected string $email,
        protected string $body,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("New Contact Form Message from {$this->name}")
            ->replyTo($this->email, $this->name)
            ->greeting('New message from the Contact Us form')
            ->line("Name: {$this->name}")
            ->line("Email: {$this->email}")
            ->line('Message:')
            ->line($this->body);
    }
}
