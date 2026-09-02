<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariation;
use App\Models\ProductVariationOption;
use App\Services\InventoryService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CatalogSeeder extends Seeder
{
    protected InventoryService $inventoryService;

    protected const PLACEHOLDER_PATH = 'products/placeholder.svg';

    /**
     * category => [subcategory => [ [name, price, sale_price?, description, featured?, new?, best?, variations?] ]]
     */
    protected array $catalog = [
        'Electronics' => [
            'Mobile Phones' => [
                ['Galaxy Nova 12 Smartphone 128GB', 89999, 79999, 'A vibrant 6.5" display, 128GB storage and all-day battery life.', true, false, true],
                ['AeroPhone Lite 64GB', 44999, null, 'Reliable everyday smartphone with a 50MP camera.', false, true, false],
                ['Prime Note X 256GB', 129999, 114999, 'Flagship performance with a large AMOLED display.', true, false, false],
            ],
            'Laptops' => [
                ['UltraBook Air 14" i5, 8GB/512GB', 189999, null, 'Slim and lightweight laptop for work and study.', true, false, false],
                ['GameMax Pro 15" Ryzen 7, 16GB/1TB', 249999, 229999, 'High-performance laptop for gaming and creative work.', false, true, false],
            ],
            'Accessories' => [
                ['Wireless Bluetooth Earbuds', 3999, 2999, 'Crisp sound, noise isolation, and 24-hour battery with the case.', true, false, true],
                ['Fast Charge Power Bank 20000mAh', 3499, null, 'Charge two devices at once with fast-charging support.', false, false, true],
                ['USB-C Charging Cable 1.5m (3-pack)', 899, 699, 'Durable braided cables for daily use.', false, false, false],
            ],
        ],
        'Fashion' => [
            "Men's Clothing" => [
                ['Classic Cotton T-Shirt', 1299, null, 'Soft, breathable cotton tee for everyday wear.', false, false, true, ['Size' => ['S', 'M', 'L', 'XL'], 'Color' => ['Black', 'White', 'Navy']]],
                ['Slim Fit Casual Shirt', 2499, 1999, 'Wrinkle-resistant fabric with a modern slim fit.', true, false, false, ['Size' => ['S', 'M', 'L', 'XL']]],
            ],
            "Women's Clothing" => [
                ['Embroidered Lawn 3-Piece Suit', 4999, 3999, 'Unstitched lawn suit with embroidered neckline.', true, true, true],
                ['Casual Kurti - Printed', 1899, null, 'Comfortable everyday kurti in a floral print.', false, false, false, ['Size' => ['S', 'M', 'L', 'XL']]],
            ],
            'Footwear' => [
                ['Running Sports Shoes', 3999, 3299, 'Cushioned sole for all-day comfort during workouts.', true, false, false, ['Size' => ['40', '41', '42', '43', '44']]],
                ['Leather Formal Shoes', 4499, null, 'Genuine leather formal shoes for office wear.', false, false, false, ['Size' => ['40', '41', '42', '43', '44']]],
            ],
            'Bags & Accessories' => [
                ['Canvas Tote Bag', 1799, 1399, 'Spacious canvas tote for everyday errands and shopping.', true, false, false],
                ["Men's Leather Wallet", 1499, null, 'Genuine leather bifold wallet with card slots.', false, false, false],
            ],
            'Jewelry & Watches' => [
                ['Bluetooth Smart Watch', 6999, 5499, 'Track fitness, calls, and notifications on the go.', true, true, false],
                ['Rose Gold Plated Necklace Set', 2299, 1799, 'Elegant necklace and earrings set for special occasions.', false, false, false],
            ],
        ],
        "Kids' Items" => [
            'Toys' => [
                ['Building Blocks Set 200pcs', 2499, 1999, 'Creative building blocks that spark imagination.', true, false, false],
                ['Remote Control Racing Car', 3499, null, 'Fast and durable RC car for indoor and outdoor play.', false, true, true],
            ],
            'School Supplies' => [
                ['Kids Backpack - Cartoon Print', 1799, 1399, 'Spacious backpack with padded straps.', false, false, false],
                ['Stationery Set (30 pieces)', 899, null, 'Complete stationery kit for school.', false, false, false],
            ],
            'Baby Products' => [
                ['Baby Feeding Bottle Set', 1299, 999, 'BPA-free feeding bottles, pack of 3.', false, false, false],
            ],
            "Kids' Clothing" => [
                ['Kids Cotton T-Shirt Set (3-pack)', 1599, 1299, 'Soft cotton tees in fun prints, pack of 3.', false, false, true, ['Size' => ['2-3Y', '4-5Y', '6-7Y', '8-9Y']]],
                ["Girls' Printed Frock", 1999, 1599, 'Comfortable everyday frock with a playful print.', true, false, false, ['Size' => ['2-3Y', '4-5Y', '6-7Y', '8-9Y']]],
            ],
            "Kids' Footwear" => [
                ['Kids Velcro Sneakers', 1899, 1499, 'Easy velcro-strap sneakers for active kids.', false, true, false, ['Size' => ['28', '29', '30', '31', '32']]],
            ],
        ],
        'Home' => [
            'Home Decor' => [
                ['LED Wall Clock', 1999, 1599, 'Modern LED wall clock with silent movement.', false, true, false],
                ['Decorative Cushion Covers (Set of 5)', 1499, null, 'Add color to your living room in minutes.', false, false, false],
            ],
            'Bedding & Linen' => [
                ['Soft Baby Blanket', 1599, null, 'Ultra-soft blanket safe for sensitive skin.', false, true, false],
                ['Cotton Bedsheet Set (Queen, 3 pcs)', 2999, 2399, 'Breathable cotton bedsheet with two pillow covers.', true, false, false],
            ],
            'Furniture' => [
                ['Foldable Study Table', 4999, 3999, 'Compact foldable table, ideal for small spaces.', false, false, false],
            ],
            'Lighting' => [
                ['LED Table Lamp', 1699, 1299, 'Adjustable LED lamp with 3 brightness levels.', true, false, false],
            ],
        ],
        'Kitchen' => [
            'Kitchen & Dining' => [
                ['Non-Stick Cookware Set (5 pcs)', 5999, 4799, 'Durable non-stick cookware for everyday cooking.', true, false, true],
                ['Stainless Steel Dinner Set (24 pcs)', 6499, null, 'Elegant dinner set for family gatherings.', false, false, false],
            ],
            'Kitchen Appliances' => [
                ['2-Slice Electric Toaster', 3499, 2799, 'Quick and even toasting with adjustable browning control.', true, false, false],
                ['Electric Kettle 1.7L', 2499, null, 'Fast-boil electric kettle with auto shut-off.', false, true, false],
            ],
            'Storage & Containers' => [
                ['Airtight Food Storage Containers (Set of 5)', 1299, 999, 'BPA-free airtight containers to keep food fresh longer.', false, false, true],
            ],
            'Cutlery & Utensils' => [
                ['Stainless Steel Cutlery Set (24 pcs)', 2199, 1799, 'Rust-resistant cutlery set for everyday dining.', false, false, false],
            ],
        ],
    ];

    public function run(): void
    {
        $this->inventoryService = app(InventoryService::class);
        $this->ensurePlaceholderImage();

        foreach ($this->catalog as $categoryName => $subcategories) {
            $parent = Category::firstOrCreate(
                ['slug' => Str::slug($categoryName)],
                ['name' => $categoryName, 'status' => true, 'sort_order' => 0]
            );

            foreach ($subcategories as $subName => $products) {
                $sub = Category::firstOrCreate(
                    ['slug' => Str::slug($subName)],
                    ['parent_id' => $parent->id, 'name' => $subName, 'status' => true, 'sort_order' => 0]
                );

                foreach ($products as $index => $productData) {
                    $this->createProduct($sub, $categoryName, $subName, $index, $productData);
                }
            }
        }
    }

    protected function ensurePlaceholderImage(): void
    {
        if (Storage::disk('public')->exists(self::PLACEHOLDER_PATH)) {
            return;
        }

        $svg = <<<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <rect width="600" height="600" fill="#eef2f7"/>
    <path d="M180 220h240v200a20 20 0 0 1-20 20H200a20 20 0 0 1-20-20V220z" fill="#c7d2e1"/>
    <path d="M180 220l60-70h120l60 70" fill="none" stroke="#94a3b8" stroke-width="8" stroke-linejoin="round"/>
    <circle cx="300" cy="300" r="40" fill="#94a3b8"/>
    <text x="300" y="470" font-family="sans-serif" font-size="24" fill="#94a3b8" text-anchor="middle">Product image coming soon</text>
</svg>
SVG;

        Storage::disk('public')->put(self::PLACEHOLDER_PATH, $svg);
    }

    protected function createProduct(Category $category, string $categoryName, string $subName, int $index, array $data): void
    {
        [$name, $price, $salePrice, $description, $featured, $newArrival, $bestSeller] = $data;
        $variationSpec = $data[7] ?? null;

        $slug = Str::slug($name);
        if (Product::where('slug', $slug)->exists()) {
            return;
        }

        $skuPrefix = strtoupper(Str::slug($subName, ''));
        $sku = substr($skuPrefix, 0, 4).$category->id.'-'.str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => $name,
            'slug' => $slug,
            'sku' => $sku,
            'short_description' => $description,
            'description' => $description.' Brought to you by ApniKhareedari — quality products, fast delivery across Pakistan.',
            'price' => $price,
            'sale_price' => $salePrice,
            'cost_price' => round($price * 0.7, 2),
            'has_variations' => (bool) $variationSpec,
            'status' => true,
            'featured' => $featured,
            'new_arrival' => $newArrival,
            'best_seller' => $bestSeller,
        ]);

        ProductImage::create([
            'product_id' => $product->id,
            'image' => self::PLACEHOLDER_PATH,
            'is_primary' => true,
            'sort_order' => 0,
        ]);

        if ($variationSpec) {
            $this->createVariations($product, $variationSpec, $price, $salePrice);
        } else {
            $this->inventoryService->initialize($product, null, rand(15, 80), 5);
        }
    }

    protected function createVariations(Product $product, array $variationSpec, float $price, ?float $salePrice): void
    {
        $combinations = [[]];

        foreach ($variationSpec as $attributeName => $values) {
            $next = [];
            foreach ($combinations as $combo) {
                foreach ($values as $value) {
                    $next[] = array_merge($combo, [$attributeName => $value]);
                }
            }
            $combinations = $next;
        }

        foreach ($combinations as $i => $combo) {
            $variation = ProductVariation::create([
                'product_id' => $product->id,
                'sku' => $product->sku.'-V'.($i + 1),
                'price' => $price,
                'sale_price' => $salePrice,
                'status' => true,
            ]);

            foreach ($combo as $attributeName => $attributeValue) {
                ProductVariationOption::create([
                    'product_variation_id' => $variation->id,
                    'attribute_name' => $attributeName,
                    'attribute_value' => $attributeValue,
                ]);
            }

            $this->inventoryService->initialize($product, $variation, rand(5, 30), 5);
        }
    }
}
