export default function StarRating({ value = 0, count, size = 'text-base', onChange }) {
  const stars = [1, 2, 3, 4, 5];
  const interactive = typeof onChange === 'function';

  return (
    <div className={`flex items-center gap-0.5 ${size}`}>
      {stars.map((star) => (
        <span
          key={star}
          onClick={() => interactive && onChange(star)}
          className={`${interactive ? 'cursor-pointer' : ''} ${
            star <= Math.round(value) ? 'text-amber-500' : 'text-slate-300'
          }`}
        >
          ★
        </span>
      ))}
      {typeof count === 'number' && <span className="ml-1 text-xs text-slate-500">({count})</span>}
    </div>
  );
}
