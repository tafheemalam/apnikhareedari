import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import * as catalogService from '../services/catalogService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import Seo from '../components/common/Seo';

export default function Blog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const page = Number(searchParams.get('page') || 1);

  useEffect(() => {
    setLoading(true);
    catalogService.getBlogPosts({ page }).then(setResult).finally(() => setLoading(false));
  }, [page]);

  const posts = result?.data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Seo
        title="Blog"
        description="Gift guides, buying tips and shopping ideas from ApniKhareedari."
        path="/blog"
      />
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Blog</h1>

      {loading ? (
        <LoadingSpinner />
      ) : posts.length === 0 ? (
        <EmptyState title="No posts yet" message="Check back soon for gift guides and shopping tips." />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:shadow-md"
            >
              {post.featured_image_url && (
                <img
                  src={post.featured_image_url}
                  alt={post.title}
                  loading="lazy"
                  className="h-44 w-full object-cover transition group-hover:scale-105"
                />
              )}
              <div className="p-4">
                <h2 className="font-bold text-slate-900 group-hover:text-emerald-700">{post.title}</h2>
                {post.excerpt && <p className="mt-2 line-clamp-3 text-sm text-slate-600">{post.excerpt}</p>}
                {post.published_at && (
                  <p className="mt-3 text-xs text-slate-400">
                    {new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination meta={result} onPageChange={(p) => setSearchParams({ page: p })} />
    </div>
  );
}
