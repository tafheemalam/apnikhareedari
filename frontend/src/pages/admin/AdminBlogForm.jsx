import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import * as blogService from '../../services/admin/blogService';
import { useToast } from '../../context/ToastContext';
import { extractErrorMessage } from '../../utils/format';
import { Input, Textarea, Checkbox } from '../../components/ui/FormField';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const EMPTY = {
  title: '',
  excerpt: '',
  content: '',
  meta_title: '',
  meta_description: '',
  status: false,
  featured_image: null,
};

export default function AdminBlogForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [post, setPost] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!form.featured_image) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(form.featured_image);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [form.featured_image]);

  useEffect(() => {
    if (!isEdit) return;
    blogService.getBlogPost(id).then((data) => {
      setPost(data);
      setForm({
        title: data.title,
        excerpt: data.excerpt || '',
        content: data.content,
        meta_title: data.meta_title || '',
        meta_description: data.meta_description || '',
        status: data.status,
        featured_image: null,
      });
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await blogService.updateBlogPost(id, form);
        toast.success('Blog post updated successfully');
        navigate('/admin/blog');
      } else {
        await blogService.createBlogPost(form);
        toast.success('Blog post created successfully');
        navigate('/admin/blog');
      }
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const previewHtml = form.content ? DOMPurify.sanitize(marked.parse(form.content)) : '';

  if (loading) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/admin/blog" className="text-xs text-emerald-700 hover:underline">&larr; Back to blog</Link>
      <h1 className="mb-6 mt-1 text-xl font-bold text-slate-900">{isEdit ? 'Edit Post' : 'Add Post'}</h1>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <Input label="Title" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        <Textarea
          label="Excerpt"
          rows={2}
          value={form.excerpt}
          onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
        />

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">
              Content <span className="text-red-500">*</span>
              <span className="ml-1 font-normal text-slate-400">(Markdown supported)</span>
            </label>
            <button type="button" className="text-xs font-medium text-emerald-700 hover:underline" onClick={() => setShowPreview((v) => !v)}>
              {showPreview ? 'Hide preview' : 'Show preview'}
            </button>
          </div>
          <textarea
            required
            rows={16}
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {showPreview && (
            <div
              className="prose prose-slate mt-3 max-w-none rounded-lg border border-slate-200 bg-slate-50 p-4"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Featured Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setForm((f) => ({ ...f, featured_image: e.target.files[0] }))}
            className="text-sm"
          />
          {(imagePreview || post?.featured_image_url) && (
            <img src={imagePreview || post.featured_image_url} alt="" className="mt-2 h-28 w-48 rounded-md object-cover" />
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Meta Title"
            value={form.meta_title}
            onChange={(e) => setForm((f) => ({ ...f, meta_title: e.target.value }))}
          />
          <Input
            label="Meta Description"
            value={form.meta_description}
            onChange={(e) => setForm((f) => ({ ...f, meta_description: e.target.value }))}
          />
        </div>

        <Checkbox
          label="Published"
          checked={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.checked }))}
        />

        <Button type="submit" loading={saving} className="w-full">
          {isEdit ? 'Update Post' : 'Create Post'}
        </Button>
      </form>
    </div>
  );
}
