<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ContactRequest;
use App\Models\Setting;
use App\Notifications\ContactFormSubmittedNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Notification;

class ContactController extends Controller
{
    public function store(ContactRequest $request): JsonResponse
    {
        $name = $request->validated('name');
        $email = $request->validated('email');
        $message = $request->validated('message');

        Notification::route('mail', Setting::get('store.email', config('mail.from.address')))
            ->notify(new ContactFormSubmittedNotification($name, $email, $message));

        return $this->success(null, "Thanks for reaching out! We'll get back to you soon.");
    }
}
