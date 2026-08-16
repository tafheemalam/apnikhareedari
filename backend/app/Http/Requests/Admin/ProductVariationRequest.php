<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductVariationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $variationId = $this->route('variation')?->id;
        $isCreate = $this->isMethod('post');

        return [
            'sku' => ['required', 'string', 'max:100', Rule::unique('product_variations', 'sku')->ignore($variationId)],
            'price' => ['nullable', 'numeric', 'min:0'],
            'sale_price' => ['nullable', 'numeric', 'min:0'],
            'status' => ['boolean'],
            'quantity' => [Rule::requiredIf($isCreate), 'integer', 'min:0'],
            'low_stock_threshold' => ['nullable', 'integer', 'min:0'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'options' => ['required', 'array', 'min:1'],
            'options.*.attribute_name' => ['required', 'string', 'max:100'],
            'options.*.attribute_value' => ['required', 'string', 'max:100'],
        ];
    }
}
