<?php

namespace App\Http\Requests\Admin;

use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    // The admin form never sends a `slug` — it's auto-generated from `name`
    // in the controller, after validation runs. That meant the uniqueness
    // check below was validating an empty value, not the slug actually
    // about to be inserted, so two products with the same name passed
    // validation cleanly and then crashed with a raw duplicate-key SQL
    // error instead of a normal "name already taken" message.
    protected function prepareForValidation(): void
    {
        if (! $this->filled('slug') && $this->filled('name')) {
            $this->merge(['slug' => Str::slug($this->input('name'))]);
        }
    }

    public function rules(): array
    {
        $productId = $this->route('product')?->id;
        $isCreate = $this->isMethod('post');

        return [
            'category_id' => [
                'required',
                'integer',
                'exists:categories,id',
                function ($attribute, $value, $fail) {
                    if (Category::whereKey($value)->whereHas('children')->exists()) {
                        $fail('This category has subcategories — assign the product to a specific subcategory instead.');
                    }
                },
            ],
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'alpha_dash', Rule::unique('products', 'slug')->ignore($productId)],
            'sku' => ['required', 'string', 'max:100', Rule::unique('products', 'sku')->ignore($productId)],
            'barcode' => ['nullable', 'string', 'max:100', Rule::unique('products', 'barcode')->ignore($productId)],
            'short_description' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'specifications' => ['nullable', 'array'],
            'price' => ['required', 'numeric', 'min:0'],
            'sale_price' => ['nullable', 'numeric', 'min:0', 'lt:price'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'has_variations' => ['boolean'],
            'status' => ['boolean'],
            'featured' => ['boolean'],
            'new_arrival' => ['boolean'],
            'best_seller' => ['boolean'],
            'show_in_basket' => ['boolean'],
            'stock_quantity' => [Rule::requiredIf($isCreate && ! $this->boolean('has_variations')), 'nullable', 'integer', 'min:0'],
            'low_stock_threshold' => ['nullable', 'integer', 'min:0'],
            'images' => ['nullable', 'array'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'primary_image_index' => ['nullable', 'integer', 'min:0'],
            'video' => ['nullable', 'file', 'mimetypes:video/mp4,video/quicktime,video/webm,video/x-m4v', 'max:20480'],
            'remove_video' => ['boolean'],
        ];
    }
}
