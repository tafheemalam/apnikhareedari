<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BannerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'image' => [Rule::requiredIf($this->isMethod('post')), 'nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'title' => ['nullable', 'string', 'max:255'],
            'link_url' => ['nullable', 'url', 'max:255'],
            'status' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
