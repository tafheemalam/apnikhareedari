<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdminUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;

class AdminUserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $adminRoles = ['Super Admin', 'Admin', 'Inventory Manager', 'Order Manager'];
        $admins = User::whereHas('roles', fn ($q) => $q->whereIn('name', $adminRoles))
            ->with('roles')
            ->when($request->filled('search'), fn ($q) => $q->where('name', 'like', '%'.$request->string('search').'%'))
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return $this->success($admins->through(fn ($user) => new UserResource($user)));
    }

    public function store(AdminUserRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'phone' => $request->validated('phone'),
            'password' => $request->validated('password'),
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        $user->syncRoles($request->validated('roles'));

        return $this->success(new UserResource($user), 'Admin user created successfully', 201);
    }

    public function show(User $user): JsonResponse
    {
        return $this->success(new UserResource($user->load('roles')));
    }

    public function update(AdminUserRequest $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id && ! in_array('Super Admin', $request->validated('roles'), true)) {
            return $this->error('You cannot remove your own Super Admin role', null, 422);
        }

        $data = $request->safe()->only(['name', 'email', 'phone']);

        if ($request->filled('password')) {
            $data['password'] = $request->validated('password');
        }

        $user->update($data);
        $user->syncRoles($request->validated('roles'));

        return $this->success(new UserResource($user), 'Admin user updated successfully');
    }

    public function toggleStatus(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return $this->error('You cannot deactivate your own account', null, 422);
        }

        $user->update(['is_active' => ! $user->is_active]);

        return $this->success(new UserResource($user), 'Admin status updated');
    }

    public function roles(): JsonResponse
    {
        return $this->success(Role::pluck('name'));
    }
}
