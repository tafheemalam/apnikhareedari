<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Resources\UserResource;
use App\Models\Cart;
use App\Models\User;
use App\Models\Wishlist;
use App\Notifications\CustomerRegisteredNotification;
use App\Services\CartService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;

class AuthController extends Controller
{
    public function __construct(protected CartService $cartService) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = DB::transaction(function () use ($request) {
            $user = User::create([
                'name' => $request->validated('name'),
                'email' => $request->validated('email'),
                'phone' => $request->validated('phone'),
                'password' => $request->validated('password'),
                'is_active' => true,
            ]);

            Cart::create(['user_id' => $user->id]);
            Wishlist::create(['user_id' => $user->id]);

            return $user;
        });

        $user->notify(new CustomerRegisteredNotification);
        event(new Registered($user));

        $this->cartService->mergeGuestCartIntoUser($request->header('X-Cart-Token'), $user);

        $token = $user->createToken('customer')->plainTextToken;

        return $this->success([
            'user' => new UserResource($user),
            'token' => $token,
        ], 'Registration successful', 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->validated('email'))->first();

        if (! $user || ! Auth::validate(['email' => $user->email, 'password' => $request->validated('password')])) {
            return $this->error('Invalid credentials', null, 401);
        }

        if (! $user->is_active) {
            return $this->error('This account has been deactivated', null, 403);
        }

        $this->cartService->mergeGuestCartIntoUser($request->header('X-Cart-Token'), $user);

        $token = $user->createToken('auth')->plainTextToken;

        return $this->success([
            'user' => new UserResource($user),
            'token' => $token,
        ], 'Login successful');
    }

    public function logout(): JsonResponse
    {
        request()->user()->currentAccessToken()->delete();

        return $this->success(null, 'Logged out successfully');
    }

    public function me(): JsonResponse
    {
        return $this->success(new UserResource(request()->user()));
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $status = Password::sendResetLink($request->validated());

        if ($status !== Password::RESET_LINK_SENT) {
            return $this->error('Unable to send reset link', null, 422);
        }

        return $this->success(null, 'Password reset link sent to your email');
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->validated(),
            function (User $user, string $password) {
                $user->forceFill(['password' => $password])->save();
                $user->tokens()->delete();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return $this->error('Invalid or expired reset token', null, 422);
        }

        return $this->success(null, 'Password reset successfully');
    }
}
