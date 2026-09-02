<?php

namespace App\Http\Requests\Admin;

use App\Rules\PakistaniPhoneNumber;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class AdminUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user')?->id;
        $isCreate = $this->isMethod('post');

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email:rfc', 'max:255', Rule::unique('users', 'email')->ignore($userId)],
            'phone' => ['nullable', 'string', new PakistaniPhoneNumber],
            'password' => [Rule::requiredIf($isCreate), 'nullable', 'string', Password::min(8)->mixedCase()->numbers()->symbols()],
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => ['string', Rule::in(['Super Admin', 'Admin', 'Inventory Manager', 'Order Manager'])],
        ];
    }
}
