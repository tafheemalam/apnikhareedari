import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as catalogService from '../services/catalogService';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, extractErrorMessage } from '../utils/format';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorState from '../components/ui/ErrorState';
import StarRating from '../components/ui/StarRating';
import Button from '../components/ui/Button';
import ReviewForm from '../components/ReviewForm';

export default function ProductDetails() {
  const { slug } = useParams();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    catalogService
      .getProduct(slug)
      .then((data) => {
        setProduct(data);
        setActiveImage(0);
        setSelectedOptions({});
        setQuantity(1);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const attributeGroups = useMemo(() => {
    if (!product?.variations?.length) return {};
    const groups = {};
    product.variations.forEach((variation) => {
      variation.options.forEach((opt) => {
        groups[opt.attribute_name] = groups[opt.attribute_name] || new Set();
        groups[opt.attribute_name].add(opt.attribute_value);
      });
    });
    return Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, [...v]]));
  }, [product]);

  const selectedVariation = useMemo(() => {
    if (!product?.has_variations) return null;
    return product.variations.find((variation) =>
      variation.options.every((opt) => selectedOptions[opt.attribute_name] === opt.attribute_value)
    );
  }, [product, selectedOptions]);

  if (loading) return <LoadingSpinner className="min-h-[50vh]" />;
  if (error || !product) return <ErrorState message="Product not found." />;

  const images = product.images.length ? product.images : [{ url: null }];
  const needsVariation = product.has_variations;
  const canAddToCart = needsVariation ? !!selectedVariation : true;
  const stock = needsVariation ? selectedVariation?.stock_quantity ?? 0 : product.stock_quantity;

  async function handleAddToCart() {
    if (!canAddToCart) {
      toast.error('Please select all options first');
      return;
    }
    setAdding(true);
    try {
      await addItem({
        product_id: product.id,
        product_variation_id: selectedVariation?.id,
        quantity,
      });
      toast.success('Added to cart');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Could not add to cart'));
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-4 text-xs text-slate-500">
        <Link to="/" className="hover:text-emerald-700">Home</Link> /{' '}
        <Link to={`/categories/${product.category.slug}`} className="hover:text-emerald-700">{product.category.name}</Link> /{' '}
        <span className="text-slate-700">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            {images[activeImage]?.url ? (
              <img src={images[activeImage].url} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-300">No image</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${i === activeImage ? 'border-emerald-600' : 'border-transparent'}`}
                >
                  {img.url && <img src={img.url} alt="" className="h-full w-full object-cover" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
          <div className="mt-2 flex items-center gap-3">
            {product.reviews_count > 0 && <StarRating value={product.average_rating} count={product.reviews_count} />}
            <span className="text-xs text-slate-400">SKU: {selectedVariation?.sku || product.sku}</span>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-slate-900">
              {formatCurrency(selectedVariation?.current_price ?? product.current_price)}
            </span>
            {product.is_on_sale && !selectedVariation && (
              <span className="text-lg text-slate-400 line-through">{formatCurrency(product.price)}</span>
            )}
          </div>

          {product.short_description && <p className="mt-4 text-sm text-slate-600">{product.short_description}</p>}

          {Object.entries(attributeGroups).map(([attributeName, values]) => (
            <div key={attributeName} className="mt-5">
              <p className="mb-2 text-sm font-semibold text-slate-700">{attributeName}</p>
              <div className="flex flex-wrap gap-2">
                {values.map((value) => (
                  <button
                    key={value}
                    onClick={() => setSelectedOptions((s) => ({ ...s, [attributeName]: value }))}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                      selectedOptions[attributeName] === value
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'border-slate-300 text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-5 flex items-center gap-4">
            <div className="flex items-center rounded-lg border border-slate-300">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-3 py-2 text-slate-600">-</button>
              <span className="w-10 text-center text-sm font-medium">{quantity}</span>
              <button onClick={() => setQuantity((q) => Math.min(stock || 1, q + 1))} className="px-3 py-2 text-slate-600">+</button>
            </div>
            <span className="text-sm text-slate-500">
              {stock > 0 ? `${stock} in stock` : 'Out of stock'}
            </span>
          </div>

          <Button
            onClick={handleAddToCart}
            loading={adding}
            disabled={stock <= 0 || (needsVariation && !canAddToCart)}
            size="lg"
            className="mt-6 w-full sm:w-auto"
          >
            Add to Cart
          </Button>

          {product.description && (
            <div className="mt-8 border-t border-slate-200 pt-6">
              <h2 className="mb-2 text-sm font-bold text-slate-900">Description</h2>
              <p className="whitespace-pre-line text-sm text-slate-600">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      <ReviewsSection product={product} isAuthenticated={isAuthenticated} />
    </div>
  );
}

function ReviewsSection({ product, isAuthenticated }) {
  return (
    <div className="mt-12 border-t border-slate-200 pt-8">
      <h2 className="mb-4 text-xl font-bold text-slate-900">Customer Reviews</h2>
      {isAuthenticated && <ReviewForm productId={product.id} />}
      {product.reviews_count === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No reviews yet. Be the first to review this product!</p>
      ) : (
        <ReviewList productId={product.id} />
      )}
    </div>
  );
}

function ReviewList({ productId }) {
  const [reviews, setReviews] = useState(null);

  useEffect(() => {
    catalogService.getProductReviews(productId).then((data) => setReviews(data.data));
  }, [productId]);

  if (!reviews) return <LoadingSpinner size="sm" />;

  return (
    <div className="mt-4 space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-800">{review.customer_name}</span>
            <StarRating value={review.rating} size="text-sm" />
          </div>
          {review.title && <p className="mt-1 text-sm font-medium text-slate-700">{review.title}</p>}
          {review.comment && <p className="mt-1 text-sm text-slate-600">{review.comment}</p>}
        </div>
      ))}
    </div>
  );
}
