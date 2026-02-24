'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { ToolCard } from '@/components/tools/ToolCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ToolCardSkeleton } from '@/components/ui/Skeleton';
import {
  Search,
  MoreVertical,
  Edit,
  Eye,
  Wrench,
  LayoutGrid,
  List,
  Loader2,
  Power,
  PowerOff,
  FolderOpen,
  X,
  Check,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { CATEGORY_METADATA, TOOL_TYPE_METADATA } from '@/lib/tools/registry';
import type { Tool, ToolType, ToolStatus, ToolCategory } from '@/types';

const ITEMS_PER_PAGE = 12;

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Live' },
  { value: 'draft', label: 'Draft' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
];

const categoryOptions = [
  { value: '', label: 'All Categories' },
  ...Object.entries(CATEGORY_METADATA)
    .map(([key, meta]) => ({ value: key, label: meta.name }))
    .sort((a, b) => a.label.localeCompare(b.label)),
];

const typeOptions = [
  { value: '', label: 'All Types' },
  ...Object.entries(TOOL_TYPE_METADATA)
    .map(([key, meta]) => ({ value: key, label: meta.name }))
    .sort((a, b) => a.label.localeCompare(b.label)),
];

export default function AdminToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    shortDescription: '',
    description: '',
    toolType: '' as ToolType | '',
    category: '' as ToolCategory | '',
    status: '' as ToolStatus,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDiscardWarning, setShowDiscardWarning] = useState(false);

  // Fetch tools from API
  const fetchTools = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/tools');
      if (response.ok) {
        const data = await response.json();
        const toolsWithDates = data.tools.map((tool: Tool) => ({
          ...tool,
          createdAt: new Date(tool.createdAt),
          updatedAt: new Date(tool.updatedAt),
        }));
        setTools(toolsWithDates);
      }
    } catch (error) {
      console.error('Failed to fetch tools:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  // Sync seed data to database
  const syncTools = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/admin/sync-tools', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        toast.success(`Synced: ${data.stats.insertedCount} added, ${data.stats.updatedCount} updated`);
        await fetchTools();
      } else {
        toast.error(data.error || 'Sync failed');
      }
    } catch {
      toast.error('Failed to sync tools');
    } finally {
      setIsSyncing(false);
    }
  };

  // Open edit modal
  const openEditModal = (tool: Tool) => {
    setEditingTool(tool);
    setEditForm({
      name: tool.name,
      shortDescription: tool.shortDescription || '',
      description: tool.description || '',
      toolType: tool.toolType,
      category: tool.category,
      status: tool.status,
    });
    setHasUnsavedChanges(false);
    setIsEditModalOpen(true);
    setOpenMenuId(null);
  };

  // Close edit modal with unsaved warning
  const closeEditModal = () => {
    if (hasUnsavedChanges) {
      setShowDiscardWarning(true);
    } else {
      setIsEditModalOpen(false);
      setEditingTool(null);
    }
  };

  const confirmDiscard = () => {
    setShowDiscardWarning(false);
    setIsEditModalOpen(false);
    setEditingTool(null);
    setHasUnsavedChanges(false);
  };

  // Track form changes
  const updateEditForm = (updates: Partial<typeof editForm>) => {
    setEditForm(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  // Save tool changes
  const saveTool = async () => {
    if (!editingTool) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/tools', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTool.id,
          ...editForm,
        }),
      });

      if (response.ok) {
        await fetchTools();
        setHasUnsavedChanges(false);
        setIsEditModalOpen(false);
        setEditingTool(null);
        toast.success(`"${editForm.name}" updated successfully`);
      } else {
        const data = await response.json().catch(() => null);
        toast.error(data?.error || 'Failed to save changes');
      }
    } catch (error) {
      console.error('Failed to save tool:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick status toggle
  const toggleToolStatus = async (tool: Tool) => {
    const newStatus: ToolStatus = tool.status === 'active' ? 'inactive' : 'active';
    try {
      const response = await fetch('/api/admin/tools', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tool.id, status: newStatus }),
      });

      if (response.ok) {
        await fetchTools();
        toast.success(`"${tool.name}" ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      } else {
        toast.error('Failed to update tool status');
      }
    } catch (error) {
      console.error('Failed to toggle tool status:', error);
      toast.error('Failed to update tool status');
    }
    setOpenMenuId(null);
  };

  // Bulk status change
  const bulkSetStatus = async (newStatus: ToolStatus) => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    let successCount = 0;
    for (const id of ids) {
      try {
        const response = await fetch('/api/admin/tools', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: newStatus }),
        });
        if (response.ok) successCount++;
      } catch {
        // continue with rest
      }
    }
    await fetchTools();
    setSelectedIds(new Set());
    toast.success(`${successCount} tool${successCount !== 1 ? 's' : ''} set to ${newStatus}`);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Filter tools
  const filteredTools = useMemo(() => tools.filter((tool) => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || tool.status === statusFilter;
    const matchesCategory = !categoryFilter || tool.category === categoryFilter;
    const matchesType = !typeFilter || tool.toolType === typeFilter;
    return matchesSearch && matchesStatus && matchesCategory && matchesType;
  }), [tools, searchQuery, statusFilter, categoryFilter, typeFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredTools.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedTools = filteredTools.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter, categoryFilter, typeFilter]);
  // Clear selection when page changes
  useEffect(() => { setSelectedIds(new Set()); }, [safeCurrentPage]);

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedTools.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedTools.map(t => t.id)));
    }
  };

  const statusCounts = {
    all: tools.length,
    active: tools.filter(t => t.status === 'active').length,
    draft: tools.filter(t => t.status === 'draft').length,
    inactive: tools.filter(t => t.status === 'inactive').length,
    archived: tools.filter(t => t.status === 'archived').length,
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <DashboardLayout variant="admin">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-mojitax-navy mb-1">Tools Management</h1>
            <p className="text-slate-600">Categorise, configure, and manage tools uploaded by developers</p>
          </div>
        </div>
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ToolCardSkeleton key={i} />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout variant="admin">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-mojitax-navy mb-1">
            Tools Management
          </h1>
          <p className="text-slate-600">
            Categorise, configure, and manage tools uploaded by developers
          </p>
        </div>
        <Button
          variant="outline"
          onClick={syncTools}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {isSyncing ? 'Syncing...' : 'Sync Tools'}
        </Button>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-blue-800">
            {selectedIds.size} selected
          </span>
          <div className="h-4 w-px bg-blue-200" />
          <Button variant="outline" size="sm" onClick={() => bulkSetStatus('active')}>
            <Power className="w-3.5 h-3.5" />
            Activate
          </Button>
          <Button variant="outline" size="sm" onClick={() => bulkSetStatus('inactive')}>
            <PowerOff className="w-3.5 h-3.5" />
            Deactivate
          </Button>
          <Button variant="outline" size="sm" onClick={() => bulkSetStatus('draft')}>
            Set Draft
          </Button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-sm text-blue-600 hover:text-blue-800"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="w-40">
                <Select
                  options={statusOptions}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                />
              </div>
              <div className="w-48">
                <Select
                  options={categoryOptions}
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                />
              </div>
              <div className="w-44">
                <Select
                  options={typeOptions}
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                />
              </div>

              <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-slate-100 text-mojitax-navy' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-slate-100 text-mojitax-navy' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Status Quick Filters */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
            {([
              { key: '', label: 'All', count: statusCounts.all, activeClass: 'bg-mojitax-navy text-white' },
              { key: 'active', label: 'Live', count: statusCounts.active, activeClass: 'bg-mojitax-green text-white' },
              { key: 'draft', label: 'Draft', count: statusCounts.draft, activeClass: 'bg-slate-600 text-white' },
              { key: 'inactive', label: 'Inactive', count: statusCounts.inactive, activeClass: 'bg-amber-500 text-white' },
              { key: 'archived', label: 'Archived', count: statusCounts.archived, activeClass: 'bg-red-500 text-white' },
            ] as const).map(({ key, label, count, activeClass }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  statusFilter === key ? activeClass : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tools Grid/List */}
      {filteredTools.length === 0 ? (
        <EmptyState
          icon={searchQuery || statusFilter || categoryFilter || typeFilter ? Wrench : FolderOpen}
          title={searchQuery || statusFilter || categoryFilter || typeFilter ? "No tools found" : "No tools uploaded yet"}
          description={searchQuery || statusFilter || categoryFilter || typeFilter
            ? "Try adjusting your search or filters"
            : "Tools will appear here once developers upload them to the platform."
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedTools.map((tool) => (
            <div key={tool.id} className="relative group">
              <button
                onClick={(e) => { e.stopPropagation(); toggleSelect(tool.id); }}
                className="absolute top-4 left-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                style={selectedIds.has(tool.id) ? { opacity: 1 } : undefined}
              >
                {selectedIds.has(tool.id) ? (
                  <CheckSquare className="w-5 h-5 text-mojitax-green" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400" />
                )}
              </button>

              <div onClick={() => openEditModal(tool)} className="cursor-pointer">
                <ToolCard tool={tool} variant="admin" showStatus />
              </div>

              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === tool.id ? null : tool.id);
                    }}
                    className="p-1.5 rounded-lg bg-white shadow-sm border border-slate-200 hover:bg-slate-50"
                  >
                    <MoreVertical className="w-4 h-4 text-slate-600" />
                  </button>

                  {openMenuId === tool.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                      <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                          onClick={() => openEditModal(tool)}
                        >
                          <Edit className="w-4 h-4" />
                          Edit Details
                        </button>
                        <Link
                          href={`/tools/${tool.slug}`}
                          target="_blank"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                          onClick={() => setOpenMenuId(null)}
                        >
                          <Eye className="w-4 h-4" />
                          Preview
                        </Link>
                        <div className="border-t border-slate-100 my-1" />
                        {tool.status === 'active' ? (
                          <button
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-600 hover:bg-amber-50"
                            onClick={() => toggleToolStatus(tool)}
                          >
                            <PowerOff className="w-4 h-4" />
                            Deactivate
                          </button>
                        ) : (
                          <button
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-mojitax-green hover:bg-green-50"
                            onClick={() => toggleToolStatus(tool)}
                          >
                            <Power className="w-4 h-4" />
                            Activate
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left px-4 py-3 w-10">
                    <button onClick={toggleSelectAll}>
                      {selectedIds.size === paginatedTools.length && paginatedTools.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-mojitax-green" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Type</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Category</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Updated</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTools.map((tool) => (
                  <tr key={tool.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <button onClick={() => toggleSelect(tool.id)}>
                        {selectedIds.has(tool.id) ? (
                          <CheckSquare className="w-4 h-4 text-mojitax-green" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={tool.status as 'active' | 'draft' | 'inactive' | 'archived'}
                        dot
                        size="sm"
                      >
                        {tool.status === 'active' ? 'Live' : tool.status.charAt(0).toUpperCase() + tool.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEditModal(tool)}
                        className="font-medium text-mojitax-navy hover:text-mojitax-green-dark"
                      >
                        {tool.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 capitalize">
                      {tool.toolType.replace('-', ' ')}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 capitalize">
                      {tool.category?.replace(/_/g, ' ') || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {tool.updatedAt.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(tool)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Link href={`/tools/${tool.slug}`} target="_blank">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredTools.length)} of {filteredTools.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <span className="text-sm text-slate-600 px-2">
              {safeCurrentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-mojitax-green" />
          Live - Visible to users
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          Draft - In development
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          Inactive - Temporarily hidden
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          Archived - No longer available
        </span>
      </div>

      {/* Edit Tool Modal */}
      {isEditModalOpen && editingTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeEditModal} />

          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden mx-4">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-semibold text-mojitax-navy">Edit Tool</h2>
                <p className="text-sm text-slate-500">{editingTool.slug}</p>
              </div>
              <button
                onClick={closeEditModal}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {hasUnsavedChanges && (
              <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2 text-xs text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5" />
                You have unsaved changes
              </div>
            )}

            <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <Input
                  value={editForm.name}
                  onChange={(e) => updateEditForm({ name: e.target.value })}
                  placeholder="Tool name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Short Description</label>
                <textarea
                  value={editForm.shortDescription}
                  onChange={(e) => updateEditForm({ shortDescription: e.target.value })}
                  placeholder="Brief description shown on cards and listings"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mojitax-green/50 focus:border-mojitax-green resize-none"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => updateEditForm({ description: e.target.value })}
                  placeholder="Detailed description shown on the tool page."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mojitax-green/50 focus:border-mojitax-green resize-y"
                  rows={4}
                />
                <p className="mt-1 text-xs text-slate-400">Shown on the tool&apos;s detail page</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tool Type</label>
                  <Select
                    options={typeOptions.filter(o => o.value !== '')}
                    value={editForm.toolType}
                    onChange={(e) => updateEditForm({ toolType: e.target.value as ToolType })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <Select
                    options={categoryOptions.filter(o => o.value !== '')}
                    value={editForm.category}
                    onChange={(e) => updateEditForm({ category: e.target.value as ToolCategory })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <Select
                  options={statusOptions.filter(o => o.value !== '')}
                  value={editForm.status}
                  onChange={(e) => updateEditForm({ status: e.target.value as ToolStatus })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50">
              <Link
                href={`/tools/${editingTool.slug}`}
                target="_blank"
                className="text-sm text-slate-600 hover:text-mojitax-green flex items-center gap-1"
              >
                <Eye className="w-4 h-4" />
                Preview Tool
              </Link>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={closeEditModal} disabled={isSaving}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={saveTool} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discard Changes Confirmation */}
      {showDiscardWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDiscardWarning(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-mojitax-navy">Discard changes?</h3>
                <p className="text-sm text-slate-500">Your unsaved changes will be lost.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDiscardWarning(false)}>
                Keep Editing
              </Button>
              <Button variant="danger" onClick={confirmDiscard}>
                Discard
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
