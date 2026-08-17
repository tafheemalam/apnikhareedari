import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function SearchBar({ className = '' }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [term, setTerm] = useState(params.get('search') || '');

  function handleSubmit(e) {
    e.preventDefault();
    if (term.trim()) {
      navigate(`/search?search=${encodeURIComponent(term.trim())}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`flex w-full items-center ${className}`}>
      <input
        type="search"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search for products..."
        aria-label="Search products"
        className="w-full rounded-l-lg border border-slate-300 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
      <button
        type="submit"
        className="rounded-r-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        aria-label="Search"
      >
        🔍
      </button>
    </form>
  );
}
