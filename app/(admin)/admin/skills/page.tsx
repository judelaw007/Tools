'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  Wrench,
  ArrowLeft,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Save,
  AlertCircle,
} from 'lucide-react';

interface SkillCategory {
  id: string;
  name: string;
  slug: string;
  knowledgeDescription: string | null;
  displayOrder: number;
  isActive: boolean;
  courses: Array<{
    id: string;
    categoryId: string;
    courseId: string;
    courseName: string | null;
  }>;
  tools: Array<{
    id: string;
    categoryId: string;
    toolId: string;
    toolName: string | null;
    applicationDescription: string | null;
    displayOrder: number;
  }>;
}

interface Course {
  id: string;
  title: string;
  type: string;
}

interface Tool {
  id: string;
  name: string;
  slug: string;
  category: string;
}

export default function AdminSkillsPage() {
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SkillCategory | null>(null);

  // Course/Tool linking
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isLoadingTools, setIsLoadingTools] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    knowledgeDescription: '',
    displayOrder: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/skills');
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch available courses
  const fetchCourses = useCallback(async () => {
    setIsLoadingCourses(true);
    try {
      const response = await fetch('/api/learnworlds/test');
      const data = await response.json();
      if (data.success && data.courses) {
        setAvailableCourses(data.courses.filter((c: Course) => c.type === 'course'));
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setIsLoadingCourses(false);
    }
  }, []);

  // Fetch available tools
  const fetchTools = useCallback(async () => {
    setIsLoadingTools(true);
    try {
      const response = await fetch('/api/admin/tools');
      const data = await response.json();
      if (data.tools) {
        setAvailableTools(data.tools);
      }
    } catch (err) {
      console.error('Failed to fetch tools:', err);
    } finally {
      setIsLoadingTools(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchCourses();
    fetchTools();
  }, [fetchCategories, fetchCourses, fetchTools]);

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Handle create
  const handleCreate = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        await fetchCategories();
        setIsCreateModalOpen(false);
        resetForm();
      } else {
        setError(data.error || 'Failed to create category');
      }
    } catch (err) {
      setError('Failed to create category');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle update
  const handleUpdate = async () => {
    if (!editingCategory) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/skills/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        await fetchCategories();
        setIsEditModalOpen(false);
        setEditingCategory(null);
        resetForm();
      } else {
        setError(data.error || 'Failed to update category');
      }
    } catch (err) {
      setError('Failed to update category');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this skill category?')) return;

    try {
      const response = await fetch(`/api/admin/skills/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        await fetchCategories();
      }
    } catch (err) {
      console.error('Failed to delete category:', err);
    }
  };

  // Add course to category
  const handleAddCourse = async (categoryId: string, courseId: string, courseName: string) => {
    try {
      const response = await fetch(`/api/admin/skills/${categoryId}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, courseName }),
      });

      if (response.ok) {
        await fetchCategories();
      }
    } catch (err) {
      console.error('Failed to add course:', err);
    }
  };

  // Remove course from category
  const handleRemoveCourse = async (categoryId: string, courseId: string) => {
    try {
      const response = await fetch(`/api/admin/skills/${categoryId}/courses`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });

      if (response.ok) {
        await fetchCategories();
      }
    } catch (err) {
      console.error('Failed to remove course:', err);
    }
  };

  // Add tool to category
  const handleAddTool = async (categoryId: string, toolId: string, toolName: string) => {
    try {
      const response = await fetch(`/api/admin/skills/${categoryId}/tools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId, toolName }),
      });

      if (response.ok) {
        await fetchCategories();
      }
    } catch (err) {
      console.error('Failed to add tool:', err);
    }
  };

  // Remove tool from category
  const handleRemoveTool = async (categoryId: string, toolId: string) => {
    try {
      const response = await fetch(`/api/admin/skills/${categoryId}/tools`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId }),
      });

      if (response.ok) {
        await fetchCategories();
      }
    } catch (err) {
      console.error('Failed to remove tool:', err);
    }
  };

  // Update tool description
  const handleUpdateToolDescription = async (categoryId: string, toolId: string, description: string) => {
    try {
      const response = await fetch(`/api/admin/skills/${categoryId}/tools`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId, applicationDescription: description }),
      });

      if (response.ok) {
        await fetchCategories();
      }
    } catch (err) {
      console.error('Failed to update tool description:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      knowledgeDescription: '',
      displayOrder: 0,
    });
    setError(null);
  };

  const openEditModal = (category: SkillCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      knowledgeDescription: category.knowledgeDescription || '',
      displayOrder: category.displayOrder,
    });
    setIsEditModalOpen(true);
  };

  return (
    <DashboardLayout variant="admin">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/admin"
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-mojitax-navy">
              Skills Matrix Configuration
            </h1>
          </div>
          <p className="text-slate-600">
            Define skill categories with Knowledge (from courses) and Application (from tools).
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            resetForm();
            setIsCreateModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4" />
          Add Skill Category
        </Button>
      </div>

      {/* Categories List */}
      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 text-slate-300 animate-spin mx-auto mb-3" />
            <p className="text-slate-500">Loading skill categories...</p>
          </CardContent>
        </Card>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-mojitax-navy mb-2">
              No Skill Categories Yet
            </h3>
            <p className="text-slate-500 mb-4">
              Create your first skill category to start building the Skills Matrix.
            </p>
            <Button
              variant="primary"
              onClick={() => {
                resetForm();
                setIsCreateModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4" />
              Create First Category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardHeader
                className="cursor-pointer"
                onClick={() => setExpandedId(expandedId === category.id ? null : category.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-mojitax-green/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-mojitax-green" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="default" size="sm">
                          {category.courses.length} course{category.courses.length !== 1 ? 's' : ''}
                        </Badge>
                        <Badge variant="info" size="sm">
                          {category.tools.length} tool{category.tools.length !== 1 ? 's' : ''}
                        </Badge>
                        {!category.isActive && (
                          <Badge variant="warning" size="sm">Inactive</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(category);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(category.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                    {expandedId === category.id ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {expandedId === category.id && (
                <CardContent className="border-t border-slate-100 pt-4">
                  {/* Knowledge Description */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Knowledge Description
                    </h4>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      {category.knowledgeDescription ? (
                        <p className="text-sm text-purple-800">{category.knowledgeDescription}</p>
                      ) : (
                        <p className="text-sm text-purple-400 italic">No description set. Edit the category to add one.</p>
                      )}
                    </div>
                  </div>

                  {/* Linked Courses */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Linked Courses (trigger Knowledge)
                    </h4>
                    <div className="space-y-2">
                      {category.courses.map((course) => (
                        <div key={course.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                          <span className="text-sm text-slate-700">{course.courseName || course.courseId}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveCourse(category.id, course.courseId)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                      {/* Add course dropdown */}
                      <select
                        className="w-full p-2 text-sm border border-slate-200 rounded-lg"
                        value=""
                        onChange={(e) => {
                          const course = availableCourses.find(c => c.id === e.target.value);
                          if (course) {
                            handleAddCourse(category.id, course.id, course.title);
                          }
                        }}
                      >
                        <option value="">+ Add course...</option>
                        {availableCourses
                          .filter(c => !category.courses.some(cc => cc.courseId === c.id))
                          .map(course => (
                            <option key={course.id} value={course.id}>{course.title}</option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* Linked Tools */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <Wrench className="w-4 h-4" />
                      Linked Tools (trigger Application)
                    </h4>
                    <div className="space-y-2">
                      {category.tools.map((tool) => (
                        <div key={tool.id} className="p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-700">{tool.toolName || tool.toolId}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveTool(category.id, tool.toolId)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                          <textarea
                            className="w-full p-2 text-sm border border-slate-200 rounded-lg resize-none"
                            rows={2}
                            placeholder="Application description (shown when user completes projects)..."
                            defaultValue={tool.applicationDescription || ''}
                            onBlur={(e) => {
                              if (e.target.value !== tool.applicationDescription) {
                                handleUpdateToolDescription(category.id, tool.toolId, e.target.value);
                              }
                            }}
                          />
                        </div>
                      ))}
                      {/* Add tool dropdown */}
                      <select
                        className="w-full p-2 text-sm border border-slate-200 rounded-lg"
                        value=""
                        onChange={(e) => {
                          const tool = availableTools.find(t => t.id === e.target.value);
                          if (tool) {
                            handleAddTool(category.id, tool.id, tool.name);
                          }
                        }}
                      >
                        <option value="">+ Add tool...</option>
                        {availableTools
                          .filter(t => !category.tools.some(ct => ct.toolId === t.id))
                          .map(tool => (
                            <option key={tool.id} value={tool.id}>{tool.name}</option>
                          ))}
                      </select>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => {
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
            setEditingCategory(null);
            resetForm();
          }} />

          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-mojitax-navy">
                {isEditModalOpen ? 'Edit Skill Category' : 'Create Skill Category'}
              </h2>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                  setEditingCategory(null);
                  resetForm();
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mojitax-green/50"
                  placeholder="e.g., Pillar 2 Skills"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      name: e.target.value,
                      slug: isCreateModalOpen ? generateSlug(e.target.value) : formData.slug,
                    });
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mojitax-green/50"
                  placeholder="e.g., pillar-2-skills"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Knowledge Description
                </label>
                <textarea
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mojitax-green/50 resize-none"
                  rows={4}
                  placeholder="Describe what knowledge this skill represents..."
                  value={formData.knowledgeDescription}
                  onChange={(e) => setFormData({ ...formData, knowledgeDescription: e.target.value })}
                />
                <p className="text-xs text-slate-500 mt-1">
                  This description is shown when a user completes a linked course.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mojitax-green/50"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                  setEditingCategory(null);
                  resetForm();
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={isEditModalOpen ? handleUpdate : handleCreate}
                disabled={isSaving || !formData.name || !formData.slug}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isEditModalOpen ? 'Update' : 'Create'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Help Card */}
      <Card className="mt-6">
        <CardContent className="p-4 bg-blue-50">
          <h4 className="font-medium text-blue-800 mb-2">How Skills Matrix Works</h4>
          <div className="text-sm text-blue-700 space-y-2">
            <p><strong>Knowledge:</strong> Awarded when a user completes any linked course. The Knowledge Description you write will be shown in their Skills Matrix.</p>
            <p><strong>Application:</strong> Awarded when a user saves projects using linked tools. Each tool can have its own Application Description describing what using that tool demonstrates.</p>
            <p className="text-xs text-blue-600 mt-3">
              Example: Link &quot;CIOT - Pillar 2&quot; course to a &quot;Pillar 2 Skills&quot; category. When a user completes that course, they earn the Knowledge badge with your description.
            </p>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
