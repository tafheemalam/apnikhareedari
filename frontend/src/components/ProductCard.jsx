import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/format';
import StarRating from './ui/StarRating';

export default function ProductCard({ product }) {
  const image = product.primary_image_url || product.images?.[0]?.url;
  const discountPercent =
    product.is_on_sale && product.price
      ? Math.round(((product.price - product.sale_price) / product.price) * 100)
      : null;

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">No image</div>
        )}
        {discountPercent > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
            -{discountPercent}%
          </span>
        )}
        {!product.in_stock && (
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
          {product.is_on_sale && (
            <span className="text-xs text-slate-400 line-through">{formatCurrency(product.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
