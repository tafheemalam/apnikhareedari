<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;

class ImageUploadService
{
    protected ImageManager $manager;

    public function __construct()
    {
        $this->manager = new ImageManager(new Driver);
    }

    /**
     * Store an uploaded image under the given disk directory, resizing it down
     * to a sane max width, and return its stored relative path.
     */
    public function store(UploadedFile $file, string $directory, int $maxWidth = 1600): string
    {
        $filename = $directory.'/'.Str::uuid()->toString().'.'.$file->getClientOriginalExtension();

        $image = $this->manager->read($file->getRealPath());

        if ($image->width() > $maxWidth) {
            $image->scale(width: $maxWidth);
        }

        Storage::disk('public')->put($filename, (string) $image->encode());

        return $filename;
    }

    public function delete(?string $path): void
    {
        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }
}
