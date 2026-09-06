import { useState } from 'react';
import * as catalogService from '../services/catalogService';
import { formatCurrency, extractErrorMessage } from '../utils/format';
import { useToast } from '../context/ToastContext';
import StarRating from './ui/StarRating';
import Button from './ui/Button';
import Modal from './ui/Modal';
import LoadingSpinner from './ui/LoadingSpinner';
import VariationPicker, { useVariationSelection } from './VariationPicker';

export default function BasketProductCard({ product, remainingAmount, onAdd }) {
  const toast = useToast();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [fullProduct, setFullProduct] = useState(null);
  const [loadingVariations, setLoadingVariations] = useState(false);
  // The product listing endpoint doesn't include `variations` (only the product detail
  // endpoint eager-loads them), so a variation product's full data is fetched on demand
  // when the picker opens rather than assumed to already be present.
  const { selectedOptions, setSelectedOptions, attributeGroups, selectedVariation } = useVariationSelection(fullProduct);

  const image = product.primary_image_url || product.images?.[0]?.url;
  const exceedsBudget = !product.has_variations && (product.current_price ?? product.price) > remainingAmount;
  const outOfStock = !product.in_stock;

  async function addSimpleProduct() {
    setAdding(true);
    try {
      await onAdd(product, null, 1);
      toast.success('Added to basket');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Could not add to basket'));
    } finally {
      setAdding(false);
    }
  }

  async function addVariation() {
    if (!selectedVariation) {
      toast.error('Please select all options first');
      return;
    }
    setAdding(true);
    try {
      await onAdd(product, selectedVariation.id, 1);
      toast.success('Added to basket');
      setPickerOpen(false);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Could not add to basket'));
    } finally {
      setAdding(false);
    }
  }

  async function handleAddClick() {
    if (!product.has_variations) {
      addSimpleProduct();
      return;
    }
    setPickerOpen(true);
    if (!fullProduct) {
      setLoadingVariations(true);
      try {
        const data = await catalogService.getProduct(product.slug);
        setFullProduct(data);
      } catch {
        toast.error('Could not load product options');
        setPickerOpen(false);
      } finally {
        setLoadingVariations(false);
      }
    }
  }

  return (
    <>
      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
          {image ? (
            <img src={image} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300">No image</div>
          )}
          {outOfStock && (
            <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-semibold text-slate-700">
              Out of stock
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1 p-3">
          <p className="line-clamp-2 text-sm font-medium text-slate-800">{product.name}</p>
          {product.reviews_count > 0 && <StarRating value={product.average_rating} count={product.reviews_count} size="text-xs" />}
          <div className="mt-auto flex items-baseline gap-2 pt-1">
            <span className="text-base font-bold text-slate-900">{formatCurrency(product.current_price ?? product.price)}</span>
            {product.is_on_sale && <span className="text-xs text-slate-400 line-through">{formatCurrency(product.price)}</span>}
          </div>
          <Button
            size="sm"
            className="mt-2 w-full"
            disabled={outOfStock || exceedsBudget}
            title={exceedsBudget ? 'Exceeds remaining budget' : undefined}
            onClick={handleAddClick}
          >
            {exceedsBudget ? 'Exceeds Budget' : 'Add to Basket'}
          </Button>
        </div>
      </div>

      <Modal open={pickerOpen} title={`Add ${product.name}`} onClose={() => setPickerOpen(false)}>
        {loadingVariations || !fullProduct ? (
          <LoadingSpinner />
        ) : (
          <>
            <VariationPicker attributeGroups={attributeGroups} selectedOptions={selectedOptions} onSelect={(name, value) => setSelectedOptions((s) => ({ ...s, [name]: value }))} />
            {selectedVariation && (
              <p className="mt-4 text-sm text-slate-600">
                Price: <span className="font-semibold text-slate-900">{formatCurrency(selectedVariation.current_price)}</span>
                {selectedVariation.current_price > remainingAmount && (
                  <span className="ml-2 text-red-600">Exceeds remaining budget</span>
                )}
              </p>
            )}
            <Button
              className="mt-4 w-full"
              loading={adding}
              disabled={!selectedVariation || selectedVariation.current_price > remainingAmount}
              onClick={addVariation}
            >
              Add to Basket
            </Button>
          </>
        )}
      </Modal>
    </>
  );
}
