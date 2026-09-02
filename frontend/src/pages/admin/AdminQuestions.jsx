import { useEffect, useState } from 'react';
import * as questionService from '../../services/admin/questionService';
import { useToast } from '../../context/ToastContext';
import { extractErrorMessage, formatDate } from '../../utils/format';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';

export default function AdminQuestions() {
  const toast = useToast();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  function load() {
    setLoading(true);
    questionService.getQuestions({ page, status: status || undefined, per_page: 15 }).then(setResult).finally(() => setLoading(false));
  }

  useEffect(load, [page, status]);

  async function handleReject(id) {
    try {
      await questionService.rejectQuestion(id);
      toast.success('Question rejected');
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleDelete(id) {
    try {
      await questionService.deleteQuestion(id);
      toast.success('Question deleted successfully');
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleDeleteAnswer(questionId, answerId) {
    try {
      await questionService.deleteAnswer(questionId, answerId);
      toast.success('Answer deleted successfully');
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  const questions = result?.data ?? [];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Questions &amp; Answers</h1>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">
          <option value="">All</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : questions.length === 0 ? (
        <EmptyState title="No questions found" />
      ) : (
        <div className="space-y-3">
          {questions.map((question) => (
            <div key={question.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{question.product?.name}</p>
                  <p className="text-xs text-slate-500">by {question.customer_name} · {formatDate(question.created_at)}</p>
                </div>
                <Badge>{question.status}</Badge>
              </div>
              <p className="mt-2 text-sm text-slate-700">Q: {question.question}</p>

              {question.answers.length > 0 && (
                <div className="mt-3 space-y-2 border-l-2 border-slate-100 pl-3">
                  {question.answers.map((answer) => (
                    <div key={answer.id} className="flex items-start justify-between gap-2">
                      <p className="text-sm text-slate-600">
                        A: {answer.answer}
                        {answer.is_seller_answer && (
                          <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">SELLER</span>
                        )}
                        <span className="ml-2 text-xs text-slate-400">— {answer.customer_name}</span>
                      </p>
                      <button onClick={() => handleDeleteAnswer(question.id, answer.id)} className="shrink-0 text-xs text-red-600 hover:underline">
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 flex gap-3 text-xs font-medium">
                {question.status !== 'rejected' && (
                  <button onClick={() => handleReject(question.id)} className="text-amber-600 hover:underline">Reject</button>
                )}
                <button onClick={() => handleDelete(question.id)} className="text-red-600 hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination meta={result} onPageChange={setPage} />
    </div>
  );
}
