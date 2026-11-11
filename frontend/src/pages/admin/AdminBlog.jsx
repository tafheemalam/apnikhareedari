import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as blogService from '../../services/admin/blogService';
import { useToast } from '../../context/ToastContext';
import { extractErrorMessage } from '../../utils/format';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';

export default function AdminBlog() {
  const toast = useToast();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  function load(targetPage = page) {
    setLoading(true);
    blogService
      .getBlogPosts({ page: targetPage, search: search || undefined, per_page: 15 })
      .then(setResult)
      .finally(() => setLoading(false));
  }

  useEffect(load, [page]);

  const searchMounted = useRef(false);
  useEffect(() => {
    if (!searchMounted.current) {
      searchMounted.current = true;
      return;
    }
    const timeout = setTimeout(() => {
      setPage(1);
      load(1);
    }, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function handleToggle(post) {
    await blogService.toggleBlogPostStatus(post.id);
    load();
  }

  async function handleDelete() {
    try {
      await blogService.deleteBlogPost(deleteTarget.id);
      toast.success('Blog post deleted successfully');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  const posts = result?.data ?? [];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Blog</h1>
        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          />
          <Button as={Link} to="/admin/blog/new" size="sm">+ Add Post</Button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : posts.length === 0 ? (
        <EmptyState title="No blog posts yet" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {posts.map((post) => (
                <tr key={post.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">{post.title}</td>
                  <td className="px-4 py-3 text-slate-500">{post.author_name || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {post.published_at ? new Date(post.published_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(post)}>
                      <Badge color={post.status ? 'green' : 'slate'}>{post.status ? 'Published' : 'Draft'}</Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 text-xs font-medium">
                      <Link to={`/admin/blog/${post.id}`} className="text-emerald-700 hover:underline">Edit</Link>
                      <button onClick={() => setDeleteTarget(post)} className="text-red-600 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination meta={result} onPageChange={setPage} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this blog post?"
        message="This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
