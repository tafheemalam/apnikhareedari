<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Accepts Pakistani mobile numbers as 03XXXXXXXXX, +923XXXXXXXXX, or 00923XXXXXXXXX
 * (spaces and dashes are ignored). Landlines and other countries' numbers are rejected —
 * this store only ships within Pakistan and needs a number couriers can actually call.
 */
class PakistaniPhoneNumber implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $normalized = preg_replace('/[\s-]+/', '', (string) $value);

        if (! preg_match('/^(?:\+92|0092|0)3\d{9}$/', $normalized)) {
            $fail('The :attribute must be a valid Pakistani mobile number, e.g. 03001234567.');
        }
    }
}
