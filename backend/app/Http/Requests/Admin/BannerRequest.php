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
            // Accepts either a full URL (https://...) or a relative in-site
            // path (/shop, /categories/home) — HeroSlider.jsx renders the
            // latter with React Router's <Link> instead of a plain <a>, so
            // Laravel's built-in `url` rule (which requires a scheme) was
            // rejecting exactly the relative links the admin UI invites.
            'link_url' => ['nullable', 'max:255', 'regex:/^(https?:\/\/[^\s]+|\/[^\s]*)$/'],
            'status' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
