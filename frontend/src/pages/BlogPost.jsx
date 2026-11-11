import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import * as catalogService from '../services/catalogService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorState from '../components/ui/ErrorState';
import Seo, { SITE_URL } from '../components/common/Seo';

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    catalogService
      .getBlogPost(slug)
      .then(setPost)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const html = useMemo(() => {
    if (!post?.content) return '';
    return DOMPurify.sanitize(marked.parse(post.content));
  }, [post?.content]);

  if (loading) return <LoadingSpinner className="min-h-[50vh]" />;
  if (error || !post) return <ErrorState message="This post could not be found." />;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || post.meta_description || undefined,
    image: post.featured_image_url || undefined,
    datePublished: post.published_at || undefined,
    author: post.author_name ? { '@type': 'Person', name: post.author_name } : undefined,
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Seo
        title={post.meta_title || post.title}
        description={post.meta_description || post.excerpt}
        path={`/blog/${post.slug}`}
        image={post.featured_image_url}
        type="article"
        jsonLd={jsonLd}
      />

      <Link to="/blog" className="text-sm font-medium text-emerald-700 hover:underline">&larr; Back to Blog</Link>

      <h1 className="mt-4 text-3xl font-bold text-slate-900">{post.title}</h1>
      {post.published_at && (
        <p className="mt-2 text-sm text-slate-500">
          {new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          {post.author_name && <> &middot; by {post.author_name}</>}
        </p>
      )}

      {post.featured_image_url && (
        <img src={post.featured_image_url} alt={post.title} className="mt-6 w-full rounded-xl object-cover" />
      )}

      <div
        className="prose prose-slate mt-8 max-w-none prose-headings:font-bold prose-a:text-emerald-700"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
