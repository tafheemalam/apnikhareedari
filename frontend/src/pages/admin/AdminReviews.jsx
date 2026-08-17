import { useEffect, useState } from 'react';
import * as reviewService from '../../services/admin/reviewService';
import { useToast } from '../../context/ToastContext';
import { extractErrorMessage, formatDate } from '../../utils/format';
import Badge from '../../components/ui/Badge';
import StarRating from '../../components/ui/StarRating';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';

export default function AdminReviews() {
  const toast = useToast();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  function load() {
    setLoading(true);
    reviewService.getReviews({ page, status: status || undefined, per_page: 15 }).then(setResult).finally(() => setLoading(false));
  }

  useEffect(load, [page, status]);

  async function handleApprove(id) {
    try {
      await reviewService.approveReview(id);
      toast.success('Review approved');
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleReject(id) {
    try {
      await reviewService.rejectReview(id);
      toast.success('Review rejected');
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleDelete(id) {
    try {
      await reviewService.deleteReview(id);
      toast.success('Review deleted successfully');
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  const reviews = result?.data ?? [];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Reviews</h1>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : reviews.length === 0 ? (
        <EmptyState title="No reviews found" />
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{review.product?.name}</p>
                  <p className="text-xs text-slate-500">by {review.customer_name} · {formatDate(review.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StarRating value={review.rating} size="text-sm" />
                  <Badge>{review.status}</Badge>
                </div>
              </div>
              {review.title && <p className="mt-2 text-sm font-medium text-slate-700">{review.title}</p>}
              {review.comment && <p className="mt-1 text-sm text-slate-600">{review.comment}</p>}
              <div className="mt-3 flex gap-3 text-xs font-medium">
                {review.status !== 'approved' && (
                  <button onClick={() => handleApprove(review.id)} className="text-emerald-700 hover:underline">Approve</button>
                )}
                {review.status !== 'rejected' && (
                  <button onClick={() => handleReject(review.id)} className="text-amber-600 hover:underline">Reject</button>
                )}
                <button onClick={() => handleDelete(review.id)} className="text-red-600 hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination meta={result} onPageChange={setPage} />
    </div>
  );
}
