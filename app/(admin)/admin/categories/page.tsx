'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Check,
  X,
  GripVertical,
  AlertTriangle,
  FolderTree,
} from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  color: string;
  displayOrder: number;
  isActive: boolean;
}

const COLOR_OPTIONS = [
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'purple', label: 'Purple' },
  { value: 'orange', label: 'Orange' },
  { value: 'cyan', label: 'Cyan' },
  { value: 'pink', label: 'Pink' },
  { value: 'slate', label: 'Slate' },
  { value: 'amber', label: 'Amber' },
  { value: 'red', label: 'Red' },
  { value: 'emerald', label: 'Emerald' },
  { value: 'indigo', label: 'Indigo' },
  { value: 'teal', label: 'Teal' },
];

const COLOR_CLASSES: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
  cyan: 'bg-cyan-100 text-cyan-700',
  pink: 'bg-pink-100 text-pink-700',
  slate: 'bg-slate-100 text-slate-700',
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  teal: 'bg-teal-100 text-teal-700',
};

const emptyForm = {
  slug: '',
  name: '',
  shortName: '',
  description: '',
  color: 'slate',
  displayOrder: 0,
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null); // null = creating new
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
      }
    } catch (e) {
      console.error('Failed to fetch categories:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreate = () => {
    setEditingSlug(null);
    setForm({ ...emptyForm, displayOrder: categories.length + 1 });
    setIsModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingSlug(cat.slug);
    setForm({
      slug: cat.slug,
      name: cat.name,
      shortName: cat.shortName,
      description: cat.description,
      color: cat.color,
      displayOrder: cat.displayOrder,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSlug(null);
  };

  const handleSave = async () => {
    if (!form.name || !form.shortName) {
      toast.error('Name and short name are required');
      return;
    }

    setIsSaving(true);
    try {
      if (editingSlug) {
        // Update
        const res = await fetch('/api/admin/categories', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: editingSlug,
            name: form.name,
            shortName: form.shortName,
            description: form.description,
            color: form.color,
            displayOrder: form.displayOrder,
          }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success(`"${form.name}" updated`);
          closeModal();
          await fetchCategories();
        } else {
          toast.error(data.error || 'Failed to update');
        }
      } else {
        // Create
        const slug = form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        const res = await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, slug }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success(`"${form.name}" created`);
          closeModal();
          await fetchCategories();
        } else {
          toast.error(data.error || 'Failed to create');
        }
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: cat.slug, isActive: !cat.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`"${cat.name}" ${cat.isActive ? 'deactivated' : 'activated'}`);
        await fetchCategories();
      } else {
        toast.error(data.error || 'Failed to update');
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/categories?slug=${encodeURIComponent(deleteTarget)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Category deleted');
        setDeleteTarget(null);
        await fetchCategories();
      } else {
        toast.error(data.error || 'Failed to delete');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout variant="admin">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-mojitax-navy mb-1">Categories</h1>
          <p className="text-slate-600">Manage tool categories</p>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout variant="admin">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-mojitax-navy mb-1">
            Categories
          </h1>
          <p className="text-slate-600">
            Manage the categories that organise your tools
          </p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </div>

      {/* Categories List */}
      {categories.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FolderTree className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-mojitax-navy mb-2">No categories yet</h3>
            <p className="text-slate-500 mb-4">Create your first category to start organising tools.</p>
            <Button variant="primary" onClick={openCreate}>
              <Plus className="w-4 h-4" />
              Add Category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 w-8">#</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Category</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Slug</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Short</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Colour</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Status</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.slug} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-400">
                      <GripVertical className="w-4 h-4 inline" />
                      {cat.displayOrder}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-mojitax-navy">{cat.name}</span>
                      {cat.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{cat.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">{cat.slug}</code>
                    </td>
                    <td className="px-4 py-3 text-sm">{cat.shortName}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${COLOR_CLASSES[cat.color] || COLOR_CLASSES.slate}`}>
                        {cat.color}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggleActive(cat)}>
                        <Badge
                          variant={cat.isActive ? 'active' : 'inactive'}
                          dot
                          size="sm"
                        >
                          {cat.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(cat)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(cat.slug)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />

          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-mojitax-navy">
                {editingSlug ? 'Edit Category' : 'New Category'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Transfer Pricing"
                />
              </div>

              {!editingSlug && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Slug</label>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="auto-generated from name"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Leave blank to auto-generate. Cannot be changed later.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Short Name *</label>
                  <Input
                    value={form.shortName}
                    onChange={(e) => setForm(prev => ({ ...prev, shortName: e.target.value }))}
                    placeholder="e.g. TP"
                    maxLength={20}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Colour</label>
                  <Select
                    options={COLOR_OPTIONS}
                    value={form.color}
                    onChange={(e) => setForm(prev => ({ ...prev, color: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this category"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mojitax-green/50 focus:border-mojitax-green resize-none"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Display Order</label>
                <Input
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => setForm(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                />
              </div>

              {/* Colour Preview */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Preview</label>
                <span className={`inline-block text-sm font-medium px-3 py-1 rounded-full ${COLOR_CLASSES[form.color] || COLOR_CLASSES.slate}`}>
                  {form.shortName || 'XX'} — {form.name || 'Category Name'}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t border-slate-200 bg-slate-50">
              <Button variant="outline" onClick={closeModal} disabled={isSaving}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><Check className="w-4 h-4" /> {editingSlug ? 'Save Changes' : 'Create'}</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-mojitax-navy">Delete category?</h3>
                <p className="text-sm text-slate-500">
                  This cannot be undone. Tools using this category must be reassigned first.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
