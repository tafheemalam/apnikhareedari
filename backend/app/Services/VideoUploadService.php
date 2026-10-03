<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class VideoUploadService
{
    /**
     * Store an uploaded video under the given disk directory and return its
     * stored relative path. Unlike ImageUploadService, no re-encoding happens
     * here — video transcoding is out of scope, so the file is stored as-is.
     */
    public function store(UploadedFile $file, string $directory): string
    {
        $filename = $directory.'/'.Str::uuid()->toString().'.'.$file->getClientOriginalExtension();

        Storage::disk('public')->putFileAs($directory, $file, basename($filename));

        return $filename;
    }

    public function delete(?string $path): void
    {
        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }
}
