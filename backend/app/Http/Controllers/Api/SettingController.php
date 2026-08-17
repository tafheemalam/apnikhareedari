<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;

class SettingController extends Controller
{
    /**
     * Only non-sensitive, storefront-relevant settings are exposed publicly.
     * Payment credentials and SMTP secrets live in .env and are never
     * surfaced through this (or any) API response.
     */
    protected const PUBLIC_KEYS = [
        'store.name', 'store.logo', 'store.favicon', 'store.email', 'store.phone', 'store.address',
        'payment.cod_enabled', 'payment.online_enabled',
        'shipping.default_rate', 'shipping.free_shipping_threshold',
        'tax.enabled', 'tax.percentage',
        'social.facebook', 'social.instagram', 'social.tiktok', 'social.youtube',
    ];

    public function index(): JsonResponse
    {
        $settings = Setting::whereIn('key', self::PUBLIC_KEYS)->pluck('value', 'key');

        return $this->success($settings);
    }
}
