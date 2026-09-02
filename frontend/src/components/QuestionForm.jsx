import { useState } from 'react';
import * as catalogService from '../services/catalogService';
import { useToast } from '../context/ToastContext';
import { extractErrorMessage } from '../utils/format';
import Button from './ui/Button';

export default function QuestionForm({ productId, onSubmitted }) {
  const toast = useToast();
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (question.trim().length < 5) {
      toast.error('Please enter at least 5 characters');
      return;
    }
    setSubmitting(true);
    try {
      const created = await catalogService.submitQuestion(productId, { question });
      toast.success('Question submitted');
      setQuestion('');
      onSubmitted?.(created);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Could not submit question'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-slate-200 p-4">
      <p className="mb-2 text-sm font-semibold text-slate-800">Ask a question</p>
      <textarea
        placeholder="What would you like to know about this product?"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        rows={2}
      />
      <Button type="submit" size="sm" className="mt-3" loading={submitting}>
        Submit Question
      </Button>
    </form>
  );
}
