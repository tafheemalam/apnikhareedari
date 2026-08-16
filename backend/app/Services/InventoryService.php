<?php

namespace App\Services;

use App\Models\Inventory;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class InventoryService
{
    /**
     * Create the inventory row for a product or variation with its starting quantity.
     */
    public function initialize(
        Product $product,
        ?ProductVariation $variation,
        int $quantity,
        int $lowStockThreshold = 5,
        ?User $actor = null,
    ): Inventory {
        return DB::transaction(function () use ($product, $variation, $quantity, $lowStockThreshold, $actor) {
            $inventory = Inventory::create([
                'product_id' => $product->id,
                'product_variation_id' => $variation?->id,
                'quantity' => $quantity,
                'low_stock_threshold' => $lowStockThreshold,
            ]);

            $this->logTransaction(
                $product,
                $variation,
                'adjustment',
                $quantity,
                previousQuantity: 0,
                newQuantity: $quantity,
                notes: 'Initial stock',
                actor: $actor,
            );

            return $inventory;
        });
    }

    /**
     * Increase stock (purchase / return / cancellation restock).
     */
    public function increase(
        Product $product,
        ?ProductVariation $variation,
        int $amount,
        string $type = 'purchase',
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?string $notes = null,
        ?User $actor = null,
    ): Inventory {
        return DB::transaction(function () use ($product, $variation, $amount, $type, $referenceType, $referenceId, $notes, $actor) {
            $inventory = $this->lockInventoryRow($product, $variation);
            $previous = $inventory->quantity;
            $inventory->quantity = $previous + $amount;
            $inventory->save();

            $this->logTransaction($product, $variation, $type, $amount, $previous, $inventory->quantity, $referenceType, $referenceId, $notes, $actor);

            return $inventory;
        });
    }

    /**
     * Decrease stock (sale / damage). Throws if insufficient stock is available.
     */
    public function decrease(
        Product $product,
        ?ProductVariation $variation,
        int $amount,
        string $type = 'sale',
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?string $notes = null,
        ?User $actor = null,
    ): Inventory {
        return DB::transaction(function () use ($product, $variation, $amount, $type, $referenceType, $referenceId, $notes, $actor) {
            $inventory = $this->lockInventoryRow($product, $variation);
            $previous = $inventory->quantity;

            if ($previous < $amount) {
                throw new RuntimeException("Insufficient stock for product #{$product->id}".($variation ? " variation #{$variation->id}" : '').". Available: {$previous}, requested: {$amount}.");
            }

            $inventory->quantity = $previous - $amount;
            $inventory->save();

            $this->logTransaction($product, $variation, $type, -$amount, $previous, $inventory->quantity, $referenceType, $referenceId, $notes, $actor);

            return $inventory;
        });
    }

    /**
     * Manually set stock to an absolute quantity (admin adjustment).
     */
    public function setQuantity(
        Product $product,
        ?ProductVariation $variation,
        int $newQuantity,
        ?string $notes = null,
        ?User $actor = null,
    ): Inventory {
        return DB::transaction(function () use ($product, $variation, $newQuantity, $notes, $actor) {
            $inventory = $this->lockInventoryRow($product, $variation);
            $previous = $inventory->quantity;
            $inventory->quantity = $newQuantity;
            $inventory->save();

            $this->logTransaction($product, $variation, 'adjustment', $newQuantity - $previous, $previous, $newQuantity, notes: $notes, actor: $actor);

            return $inventory;
        });
    }

    /**
     * Verify that the requested quantity is available without mutating stock.
     */
    public function hasAvailableStock(Product $product, ?ProductVariation $variation, int $requested): bool
    {
        $inventory = $variation ? $variation->inventory : $product->inventory;

        return $inventory !== null && $inventory->quantity >= $requested;
    }

    protected function lockInventoryRow(Product $product, ?ProductVariation $variation): Inventory
    {
        $query = Inventory::query()->where('product_id', $product->id);
        $query = $variation
            ? $query->where('product_variation_id', $variation->id)
            : $query->whereNull('product_variation_id');

        $inventory = $query->lockForUpdate()->first();

        if (! $inventory) {
            throw new RuntimeException("No inventory row exists for product #{$product->id}".($variation ? " variation #{$variation->id}" : '').'.');
        }

        return $inventory;
    }

    protected function logTransaction(
        Product $product,
        ?ProductVariation $variation,
        string $type,
        int $quantity,
        int $previousQuantity,
        int $newQuantity,
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?string $notes = null,
        ?User $actor = null,
    ): InventoryTransaction {
        return InventoryTransaction::create([
            'product_id' => $product->id,
            'product_variation_id' => $variation?->id,
            'type' => $type,
            'quantity' => $quantity,
            'previous_quantity' => $previousQuantity,
            'new_quantity' => $newQuantity,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'notes' => $notes,
            'user_id' => $actor?->id,
        ]);
    }
}
