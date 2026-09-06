<?php

namespace App\Http\Requests;

use App\Rules\PakistaniPhoneNumber;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'address_id' => ['nullable', 'integer', 'exists:addresses,id'],

            'shipping_full_name' => ['required_without:address_id', 'string', 'max:255'],
            'shipping_phone' => ['required_without:address_id', 'nullable', new PakistaniPhoneNumber],
            'shipping_email' => ['nullable', 'email:rfc'],
            'shipping_address' => ['required_without:address_id', 'string', 'max:255'],
            'shipping_city' => ['required_without:address_id', 'string', 'max:100'],
            'shipping_area' => ['nullable', 'string', 'max:100'],
            'shipping_postal_code' => ['nullable', 'string', 'max:20'],
            'delivery_notes' => ['nullable', 'string', 'max:1000'],

            'billing_same_as_shipping' => ['boolean'],
            'billing_full_name' => ['required_if:billing_same_as_shipping,false', 'nullable', 'string', 'max:255'],
            'billing_phone' => ['required_if:billing_same_as_shipping,false', 'nullable', new PakistaniPhoneNumber],
            'billing_address' => ['required_if:billing_same_as_shipping,false', 'nullable', 'string', 'max:255'],
            'billing_city' => ['required_if:billing_same_as_shipping,false', 'nullable', 'string', 'max:100'],
            'billing_area' => ['nullable', 'string', 'max:100'],
            'billing_postal_code' => ['nullable', 'string', 'max:20'],

            'payment_method' => ['required', Rule::in(['cod', 'jazzcash', 'easypaisa'])],
            'coupon_code' => ['nullable', 'string', 'max:50'],
        ];
    }
}
