<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;

class MerchantFeedController extends Controller
{
    // Products in this category are made/engraved to order and aren't eligible for
    // the standard return policy; they're tagged with a separate return_label in
    // the feed so a non-returnable policy can be assigned to them in Merchant Center.
    private const NON_RETURNABLE_CATEGORY_SLUG = 'personalized-items';
    private const NON_RETURNABLE_RETURN_LABEL = 'no-returns-personalized';

    public function index(): Response
    {
        $xml = Cache::remember('merchant-feed.xml', 3600, fn () => $this->buildXml());

        return response($xml, 200)->header('Content-Type', 'application/xml; charset=UTF-8');
    }

    private function buildXml(): string
    {
        $base = rtrim(config('app.frontend_url'), '/');

        $products = Product::active()
            ->with(['images' => fn ($q) => $q->orderByDesc('is_primary'), 'category'])
            ->get();

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
        $xml .= '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">'."\n";
        $xml .= '<channel>'."\n";
        $xml .= '  <title>ApniKhareedari Products</title>'."\n";
        $xml .= '  <link>'.e($base).'</link>'."\n";
        $xml .= '  <description>Product feed for ApniKhareedari</description>'."\n";

        foreach ($products as $product) {
            $image = $product->images->first();
            if (! $image) {
                // Google rejects items with no image; skip rather than submit an invalid entry.
                continue;
            }

            $description = $this->cleanText($product->short_description ?: $product->description);
            if ($description === '') {
                continue;
            }

            $xml .= '  <item>'."\n";
            $xml .= '    <g:id>'.$product->id.'</g:id>'."\n";
            $xml .= '    <title>'.e($this->cleanText($product->name)).'</title>'."\n";
            $xml .= '    <description>'.e($description).'</description>'."\n";
            $xml .= '    <link>'.e($base.'/products/'.$product->slug).'</link>'."\n";
            $xml .= '    <g:image_link>'.e(asset('storage/'.$image->image)).'</g:image_link>'."\n";
            $xml .= '    <g:availability>'.($product->in_stock ? 'in stock' : 'out of stock').'</g:availability>'."\n";
            $xml .= '    <g:price>'.number_format((float) $product->price, 2, '.', '').' PKR</g:price>'."\n";
            if ($product->is_on_sale) {
                $xml .= '    <g:sale_price>'.number_format((float) $product->sale_price, 2, '.', '').' PKR</g:sale_price>'."\n";
            }
            $xml .= '    <g:condition>new</g:condition>'."\n";
            $xml .= '    <g:identifier_exists>no</g:identifier_exists>'."\n";
            $xml .= '    <g:brand>ApniKhareedari</g:brand>'."\n";
            if ($product->category?->slug === self::NON_RETURNABLE_CATEGORY_SLUG) {
                $xml .= '    <g:return_label>'.self::NON_RETURNABLE_RETURN_LABEL.'</g:return_label>'."\n";
            }
            $xml .= '  </item>'."\n";
        }

        $xml .= '</channel>'."\n";
        $xml .= '</rss>';

        return $xml;
    }

    // Strips tabs/newlines/bullets from plain-text admin fields so the feed never
    // ships raw whitespace or list markers Google's parser doesn't expect.
    private function cleanText(?string $raw): string
    {
        if (! $raw) {
            return '';
        }

        $noBullets = str_replace(["\u{2022}", "\t"], ['', ' '], $raw);

        return trim(preg_replace('/\s+/', ' ', $noBullets));
    }
}
