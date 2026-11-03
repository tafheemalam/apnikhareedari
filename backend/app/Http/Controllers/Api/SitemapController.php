<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;

class SitemapController extends Controller
{
    public function index(): Response
    {
        $xml = Cache::remember('sitemap.xml', 3600, fn () => $this->buildXml());

        return response($xml, 200)->header('Content-Type', 'application/xml; charset=UTF-8');
    }

    private function buildXml(): string
    {
        $base = rtrim(config('app.frontend_url'), '/');

        $urls = collect([
            ['loc' => $base.'/', 'changefreq' => 'daily', 'priority' => '1.0'],
            ['loc' => $base.'/shop', 'changefreq' => 'daily', 'priority' => '0.9'],
        ]);

        $urls = $urls->merge(
            Category::active()->get(['slug', 'updated_at'])->map(fn ($category) => [
                'loc' => $base.'/categories/'.$category->slug,
                'lastmod' => $category->updated_at?->toAtomString(),
                'changefreq' => 'weekly',
                'priority' => '0.8',
            ])
        );

        $urls = $urls->merge(
            Product::where('status', true)->get(['slug', 'updated_at'])->map(fn ($product) => [
                'loc' => $base.'/products/'.$product->slug,
                'lastmod' => $product->updated_at?->toAtomString(),
                'changefreq' => 'weekly',
                'priority' => '0.7',
            ])
        );

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n";

        foreach ($urls as $url) {
            $xml .= '  <url>'."\n";
            $xml .= '    <loc>'.e($url['loc']).'</loc>'."\n";
            if (! empty($url['lastmod'])) {
                $xml .= '    <lastmod>'.$url['lastmod'].'</lastmod>'."\n";
            }
            $xml .= '    <changefreq>'.$url['changefreq'].'</changefreq>'."\n";
            $xml .= '    <priority>'.$url['priority'].'</priority>'."\n";
            $xml .= '  </url>'."\n";
        }

        $xml .= '</urlset>';

        return $xml;
    }
}
