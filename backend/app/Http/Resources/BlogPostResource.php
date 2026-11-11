<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BlogPostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'content' => $this->content,
            'featured_image_url' => $this->featured_image ? asset('storage/'.$this->featured_image) : null,
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'status' => (bool) $this->status,
            'author_name' => $this->whenLoaded('author', fn () => $this->author?->name),
            'published_at' => $this->published_at,
            'created_at' => $this->created_at,
        ];
    }
}
