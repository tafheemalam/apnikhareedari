<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InventoryAdjustRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'quantity' => ['required', 'integer', 'min:1'],
            'type' => ['required', Rule::in(['purchase', 'return', 'cancellation', 'sale', 'damage'])],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
