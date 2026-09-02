<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResendVerificationRequest;
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
        $user->sendEmailVerificationNotification();

        $this->cartService->mergeGuestCartIntoUser($request->header('X-Cart-Token'), $user);

        return $this->success([
            'user' => new UserResource($user),
        ], 'Registration successful. Please verify your email to continue.', 201);
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

    public function verifyEmail(Request $request, string $id, string $hash): JsonResponse
    {
        $user = User::findOrFail($id);

        if (! hash_equals($hash, sha1($user->getEmailForVerification()))) {
            return $this->error('This verification link is invalid.', null, 403);
        }

        if ($user->hasVerifiedEmail()) {
            return $this->success(null, 'Email already verified');
        }

        $user->markEmailAsVerified();

        return $this->success(null, 'Email verified successfully');
    }

    public function resendVerificationEmail(Request $request): JsonResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return $this->success(null, 'Email already verified');
        }

        $request->user()->sendEmailVerificationNotification();

        return $this->success(null, 'Verification email sent');
    }

    /**
     * Same as resendVerificationEmail() but for a customer who just registered
     * and isn't logged in yet (registration no longer issues an auth token).
     */
    public function resendVerificationEmailForGuest(ResendVerificationRequest $request): JsonResponse
    {
        $user = User::where('email', $request->validated('email'))->first();

        // Always respond the same way regardless of whether the email is
        // registered or already verified, so this endpoint can't be used to
        // enumerate existing accounts.
        if ($user && ! $user->hasVerifiedEmail()) {
            $user->sendEmailVerificationNotification();
        }

        return $this->success(null, 'If an account exists with that email and needs verification, a new link has been sent.');
    }

    public function me(): JsonResponse
    {
        return $this->success(new UserResource(request()->user()));
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        // Always respond the same way whether or not the email is registered,
        // so this endpoint can't be used to enumerate existing accounts.
        Password::sendResetLink($request->validated());

        return $this->success(null, 'If an account exists with that email, a password reset link has been sent.');
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
