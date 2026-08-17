<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AddressRequest;
use App\Http\Resources\AddressResource;
use App\Models\Address;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AddressController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $addresses = $request->user()->addresses()->orderByDesc('is_default')->latest()->get();

        return $this->success(AddressResource::collection($addresses));
    }

    public function store(AddressRequest $request): JsonResponse
    {
        $address = DB::transaction(function () use ($request) {
            $data = $request->validated();
            $data['is_default'] = $request->boolean('is_default');

            if ($data['is_default'] || ! $request->user()->addresses()->exists()) {
                $request->user()->addresses()->update(['is_default' => false]);
                $data['is_default'] = true;
            }

            return $request->user()->addresses()->create($data);
        });

        return $this->success(new AddressResource($address), 'Address added successfully', 201);
    }

    public function update(AddressRequest $request, Address $address): JsonResponse
    {
        $this->authorize('update', $address);

        DB::transaction(function () use ($request, $address) {
            $data = $request->validated();
            $data['is_default'] = $request->boolean('is_default');

            if ($data['is_default']) {
                $address->user->addresses()->where('id', '!=', $address->id)->update(['is_default' => false]);
            }

            $address->update($data);
        });

        return $this->success(new AddressResource($address), 'Address updated successfully');
    }

    public function destroy(Address $address): JsonResponse
    {
        $this->authorize('delete', $address);

        $wasDefault = $address->is_default;
        $address->delete();

        if ($wasDefault) {
            $next = $address->user->addresses()->first();
            $next?->update(['is_default' => true]);
        }

        return $this->success(null, 'Address deleted successfully');
    }

    public function setDefault(Address $address): JsonResponse
    {
        $this->authorize('update', $address);

        DB::transaction(function () use ($address) {
            $address->user->addresses()->update(['is_default' => false]);
            $address->update(['is_default' => true]);
        });

        return $this->success(new AddressResource($address), 'Default address updated');
    }
}
