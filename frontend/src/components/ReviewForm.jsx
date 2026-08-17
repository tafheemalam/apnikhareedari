import { useState } from 'react';
import * as catalogService from '../services/catalogService';
import { useToast } from '../context/ToastContext';
import { extractErrorMessage } from '../utils/format';
import StarRating from './ui/StarRating';
import Button from './ui/Button';

export default function ReviewForm({ productId }) {
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rating) {
      toast.error('Please select a star rating');
      return;
    }
    setSubmitting(true);
    try {
      await catalogService.submitReview(productId, { rating, title, comment });
      toast.success('Review submitted and awaiting approval');
      setSubmitted(true);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Could not submit review'));
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mb-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">
        Thanks! Your review has been submitted and will appear once approved.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-slate-200 p-4">
      <p className="mb-2 text-sm font-semibold text-slate-800">Write a review</p>
      <StarRating value={rating} onChange={setRating} size="text-2xl" />
      <input
        type="text"
        placeholder="Review title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <textarea
        placeholder="Share your experience with this product..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        rows={3}
      />
      <Button type="submit" size="sm" className="mt-3" loading={submitting}>
        Submit Review
      </Button>
      <p className="mt-2 text-xs text-slate-400">You can only review products from your delivered orders.</p>
    </form>
  );
}
