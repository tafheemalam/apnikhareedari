<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\ImageUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;

class SettingController extends Controller
{
    public const GROUPS = ['store', 'payment', 'shipping', 'tax', 'email', 'social'];

    public function __construct(protected ImageUploadService $imageUploadService) {}

    public function index(): JsonResponse
    {
        $settings = Setting::all()->groupBy('group')->map(fn ($group) => $group->pluck('value', 'key'));

        return $this->success($settings);
    }

    public function update(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'group' => ['required', 'string', 'in:'.implode(',', self::GROUPS)],
            'values' => ['required', 'array'],
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', $validator->errors(), 422);
        }

        foreach ($request->input('values') as $key => $value) {
            Setting::set($key, is_bool($value) ? (string) (int) $value : $value, $request->input('group'));
        }

        return $this->success(Setting::group($request->input('group')), 'Settings updated successfully');
    }

    public function uploadLogo(Request $request): JsonResponse
    {
        $request->validate(['image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp,svg', 'max:1024']]);

        $path = $this->imageUploadService->store($request->file('image'), 'store');
        Setting::set('store.logo', $path, 'store');

        return $this->success(['path' => $path, 'url' => asset('storage/'.$path)], 'Logo uploaded successfully');
    }

    public function uploadFavicon(Request $request): JsonResponse
    {
        $request->validate(['image' => ['required', 'image', 'mimes:ico,png,svg', 'max:256']]);

        $path = $this->imageUploadService->store($request->file('image'), 'store');
        Setting::set('store.favicon', $path, 'store');

        return $this->success(['path' => $path, 'url' => asset('storage/'.$path)], 'Favicon uploaded successfully');
    }
}
