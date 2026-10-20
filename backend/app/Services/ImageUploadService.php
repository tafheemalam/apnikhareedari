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
     *
     * If an identical image (by content, not filename) already exists under
     * $dedupeScope (e.g. the product's own image, re-picked for a variation),
     * that existing path is reused instead of writing a second copy — this is
     * what stops the same photo from appearing twice in the product gallery.
     */
    public function store(UploadedFile $file, string $directory, int $maxWidth = 1600, ?string $dedupeScope = null): string
    {
        $mimeMap = [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
            'image/gif'  => 'gif',
        ];
        $ext = $mimeMap[$file->getMimeType()] ?? 'jpg';

        $image = $this->manager->decodePath($file->getRealPath());

        if ($image->width() > $maxWidth) {
            $image->scale(width: $maxWidth);
        }

        $encoded = (string) $image->encode();

        $duplicate = $this->findDuplicate($encoded, $dedupeScope ?? $directory);
        if ($duplicate !== null) {
            return $duplicate;
        }

        $filename = $directory.'/'.Str::uuid()->toString().'.'.$ext;
        Storage::disk('public')->put($filename, $encoded);

        return $filename;
    }

    protected function findDuplicate(string $encoded, string $scope): ?string
    {
        $hash = sha1($encoded);

        foreach (Storage::disk('public')->allFiles($scope) as $path) {
            if (sha1(Storage::disk('public')->get($path)) === $hash) {
                return $path;
            }
        }

        return null;
    }

    public function delete(?string $path): void
    {
        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }
}
