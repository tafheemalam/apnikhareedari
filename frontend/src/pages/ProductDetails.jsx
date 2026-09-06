import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import * as catalogService from '../services/catalogService';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSite } from '../context/SiteContext';
import { formatCurrency, formatDate, extractErrorMessage } from '../utils/format';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorState from '../components/ui/ErrorState';
import StarRating from '../components/ui/StarRating';
import ZoomableImage from '../components/ui/ZoomableImage';
import Button from '../components/ui/Button';
import ReviewForm from '../components/ReviewForm';
import QuestionForm from '../components/QuestionForm';

function findColorOption(options) {
  return options.find((opt) => opt.attribute_name.toLowerCase() === 'color' || opt.attribute_name.toLowerCase() === 'colour');
}

export default function ProductDetails() {
  const { slug } = useParams();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const { settings } = useSite();
  const toast = useToast();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);

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

  // The gallery shows every color's photo up front — not just whichever one
  // happens to be selected — so a customer can see all 3 (or however many)
  // variant photos right away, plus the product's own photos.
  const images = useMemo(() => {
    const base = product?.images ?? [];
    const variantImages = (product?.variations ?? [])
      .filter((v) => v.image_url)
      .filter((v, i, arr) => arr.findIndex((other) => other.image_url === v.image_url) === i)
      .map((v) => ({ url: v.image_url, variation: v }));
    const rest = base.filter((img) => !variantImages.some((vi) => vi.url === img.url));
    const combined = [...variantImages, ...rest];
    return combined.length ? combined : [{ url: null }];
  }, [product]);

  // The gallery image tracks Color only — picking a Size never changes it,
  // since a variation photo is almost always the same shirt/shoe regardless
  // of size, and tying the image to the exact Size+Color combo meant it
  // would randomly fall back to the placeholder whenever that specific
  // combo happened to have no photo of its own. Products without a "Color"
  // attribute fall back to matching whatever's currently selected.
  const previewImageVariation = useMemo(() => {
    if (!product?.has_variations) return null;

    const colorEntry = Object.entries(selectedOptions).find(([name]) => name.toLowerCase() === 'color' || name.toLowerCase() === 'colour');

    if (colorEntry) {
      const [colorName, colorValue] = colorEntry;
      return product.variations.find((variation) =>
        variation.image_url &&
        variation.options.some((opt) => opt.attribute_name === colorName && opt.attribute_value === colorValue)
      );
    }

    const entries = Object.entries(selectedOptions);
    if (!entries.length) return null;
    return product.variations.find((variation) =>
      variation.image_url &&
      entries.every(([name, value]) => variation.options.some((opt) => opt.attribute_name === name && opt.attribute_value === value))
    );
  }, [product, selectedOptions]);

  const variantImageUrl = previewImageVariation?.image_url;

  // Selecting a color (via the swatch) jumps the main viewer to that
  // photo's position in the gallery — the event that was missing before.
  useEffect(() => {
    if (!variantImageUrl) return;
    const idx = images.findIndex((img) => img.url === variantImageUrl);
    if (idx >= 0) setActiveImage(idx);
  }, [variantImageUrl, images]);

  // ...and clicking a thumbnail does the reverse: if that photo belongs to
  // a color variation, select that color too, so the swatches and the
  // gallery never fall out of sync with each other.
  function handleThumbnailClick(img, index) {
    setActiveImage(index);
    const colorOpt = img.variation && findColorOption(img.variation.options);
    if (colorOpt) {
      setSelectedOptions((prev) => ({ ...prev, [colorOpt.attribute_name]: colorOpt.attribute_value }));
    }
  }

  if (loading) return <LoadingSpinner className="min-h-[50vh]" />;
  if (error || !product) return <ErrorState message="Product not found." />;

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

  async function handleBuyNow() {
    if (!canAddToCart) {
      toast.error('Please select all options first');
      return;
    }
    setBuyingNow(true);
    try {
      await addItem({
        product_id: product.id,
        product_variation_id: selectedVariation?.id,
        quantity,
      });
      navigate('/checkout');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Could not add to cart'));
    } finally {
      setBuyingNow(false);
    }
  }

  function handleOrderOnWhatsApp() {
    if (!canAddToCart) {
      toast.error('Please select all options first');
      return;
    }
    const whatsappNumber = (settings['payment.whatsapp_number'] || '923232665835').replace(/^0/, '92');
    const variation = selectedVariation ? ` (${selectedVariation.options.map((o) => o.attribute_value).join(', ')})` : '';
    const price = formatCurrency(selectedVariation?.current_price ?? product.current_price);
    const text = encodeURIComponent(
      `Hi! I'd like to order:\n\n*${product.name}${variation}*\nQty: ${quantity}\nPrice: ${price}\n\nPlease confirm availability and share payment details.`
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank');
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
              <ZoomableImage src={images[activeImage].url} alt={product.name} />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-300">No image</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleThumbnailClick(img, i)}
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

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              onClick={handleAddToCart}
              loading={adding}
              disabled={stock <= 0 || (needsVariation && !canAddToCart)}
              size="lg"
              className="bg-amber-500 text-white hover:bg-amber-600 focus-visible:outline-amber-500"
            >
              Add to Cart
            </Button>
            <Button
              onClick={handleBuyNow}
              loading={buyingNow}
              disabled={stock <= 0 || (needsVariation && !canAddToCart)}
              size="lg"
            >
              Buy Now
            </Button>
            <button
              type="button"
              onClick={handleOrderOnWhatsApp}
              disabled={stock <= 0 || (needsVariation && !canAddToCart)}
              className="flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#22c05e] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Order on WhatsApp
            </button>
          </div>

          {product.description && (
            <div className="mt-8 border-t border-slate-200 pt-6">
              <h2 className="mb-2 text-sm font-bold text-slate-900">Description</h2>
              <p className="whitespace-pre-line text-sm text-slate-600">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      <ReviewsSection product={product} isAuthenticated={isAuthenticated} />
      <QuestionsSection product={product} isAuthenticated={isAuthenticated} />
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

function QuestionsSection({ product, isAuthenticated }) {
  const [questions, setQuestions] = useState(null);

  function load() {
    catalogService.getProductQuestions(product.id).then((data) => setQuestions(data.data));
  }

  useEffect(load, [product.id]);

  return (
    <div className="mt-12 border-t border-slate-200 pt-8">
      <h2 className="mb-4 text-xl font-bold text-slate-900">Questions &amp; Answers</h2>
      {isAuthenticated ? (
        <QuestionForm productId={product.id} onSubmitted={load} />
      ) : (
        <p className="mb-6 text-sm text-slate-500">
          <Link to="/login" className="font-semibold text-emerald-700 hover:underline">Login</Link> to ask a question about this product.
        </p>
      )}

      {questions === null ? (
        <LoadingSpinner size="sm" />
      ) : questions.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No questions yet. Be the first to ask!</p>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <QuestionItem key={q.id} question={q} isAuthenticated={isAuthenticated} onAnswered={load} />
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionItem({ question, isAuthenticated, onAnswered }) {
  const [showAnswerForm, setShowAnswerForm] = useState(false);

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-sm font-semibold text-slate-800">Q: {question.question}</p>
      <p className="mt-1 text-xs text-slate-400">Asked by {question.customer_name} · {formatDate(question.created_at)}</p>

      {question.answers.length > 0 && (
        <div className="mt-3 space-y-2 border-l-2 border-emerald-100 pl-3">
          {question.answers.map((a) => (
            <div key={a.id}>
              <p className="text-sm text-slate-700">
                <span className="font-semibold text-emerald-700">A:</span> {a.answer}
                {a.is_seller_answer && (
                  <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">SELLER</span>
                )}
              </p>
              <p className="text-xs text-slate-400">{a.customer_name} · {formatDate(a.created_at)}</p>
            </div>
          ))}
        </div>
      )}

      {isAuthenticated && (
        showAnswerForm ? (
          <AnswerForm
            questionId={question.id}
            onSubmitted={() => { setShowAnswerForm(false); onAnswered(); }}
            onCancel={() => setShowAnswerForm(false)}
          />
        ) : (
          <button onClick={() => setShowAnswerForm(true)} className="mt-2 text-xs font-medium text-emerald-700 hover:underline">
            Answer this question
          </button>
        )
      )}
    </div>
  );
}

function AnswerForm({ questionId, onSubmitted, onCancel }) {
  const toast = useToast();
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (answer.trim().length < 2) {
      toast.error('Please enter an answer');
      return;
    }
    setSubmitting(true);
    try {
      await catalogService.submitAnswer(questionId, { answer });
      toast.success('Answer submitted');
      setAnswer('');
      onSubmitted();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Could not submit answer'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
      <input
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Write your answer..."
        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
      />
      <Button type="submit" size="sm" loading={submitting}>Post</Button>
      <button type="button" onClick={onCancel} className="text-xs text-slate-500 hover:underline">Cancel</button>
    </form>
  );
}
