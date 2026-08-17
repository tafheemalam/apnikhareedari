<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ShippingZoneRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $zoneId = $this->route('zone')?->id;

        return [
            'name' => ['required', 'string', 'max:100', Rule::unique('shipping_zones', 'name')->ignore($zoneId)],
            'status' => ['boolean'],
            'rate' => ['required', 'numeric', 'min:0'],
            'free_shipping_threshold' => ['nullable', 'numeric', 'min:0'],
            'estimated_delivery_days_min' => ['nullable', 'integer', 'min:0'],
            'estimated_delivery_days_max' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
