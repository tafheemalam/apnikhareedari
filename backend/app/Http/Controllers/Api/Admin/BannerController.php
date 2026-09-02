<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BannerRequest;
use App\Http\Resources\BannerResource;
use App\Models\Banner;
use App\Services\ImageUploadService;
use Illuminate\Http\JsonResponse;

class BannerController extends Controller
{
    public function __construct(protected ImageUploadService $imageUploadService) {}

    public function index(): JsonResponse
    {
        $banners = Banner::query()->orderBy('sort_order')->orderByDesc('created_at')->get();

        return $this->success(BannerResource::collection($banners));
    }

    public function store(BannerRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['status'] = $request->has('status') ? $request->boolean('status') : true;
        $data['image'] = $this->imageUploadService->store($request->file('image'), 'banners');

        $banner = Banner::create($data);

        return $this->success(new BannerResource($banner), 'Banner created successfully', 201);
    }

    public function update(BannerRequest $request, Banner $banner): JsonResponse
    {
        $data = $request->validated();

        if ($request->has('status')) {
            $data['status'] = $request->boolean('status');
        }

        if ($request->hasFile('image')) {
            $this->imageUploadService->delete($banner->image);
            $data['image'] = $this->imageUploadService->store($request->file('image'), 'banners');
        }

        $banner->update($data);

        return $this->success(new BannerResource($banner), 'Banner updated successfully');
    }

    public function destroy(Banner $banner): JsonResponse
    {
        $this->imageUploadService->delete($banner->image);
        $banner->delete();

        return $this->success(null, 'Banner deleted successfully');
    }

    public function toggleStatus(Banner $banner): JsonResponse
    {
        $banner->update(['status' => ! $banner->status]);

        return $this->success(new BannerResource($banner), 'Banner status updated');
    }
}
