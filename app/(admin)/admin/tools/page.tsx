'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { ToolCard } from '@/components/tools/ToolCard';
import { EmptyState } from '@/components/ui/EmptyState';
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
} from 'lucide-react';
import type { Tool, ToolStatus, ToolCategory } from '@/types';

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Live' },
  { value: 'draft', label: 'Draft' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
];

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'transfer_pricing', label: 'Transfer Pricing' },
  { value: 'vat', label: 'VAT / Indirect Tax' },
  { value: 'fatca_crs', label: 'FATCA / CRS' },
  { value: 'withholding_tax', label: 'Withholding Tax' },
  { value: 'pillar_two', label: 'Pillar Two' },
  { value: 'pe_assessment', label: 'PE Assessment' },
];

export default function AdminToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    shortDescription: '',
    category: '' as ToolCategory | '',
    status: '' as ToolStatus,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Fetch tools from API
  const fetchTools = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/tools');
      if (response.ok) {
        const data = await response.json();
        // Convert date strings to Date objects
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

  // Open edit modal
  const openEditModal = (tool: Tool) => {
    setEditingTool(tool);
    setEditForm({
      name: tool.name,
      shortDescription: tool.shortDescription || '',
      category: tool.category,
      status: tool.status,
    });
    setIsEditModalOpen(true);
    setOpenMenuId(null);
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
        // Refresh tools list
        await fetchTools();
        setIsEditModalOpen(false);
        setEditingTool(null);
      }
    } catch (error) {
      console.error('Failed to save tool:', error);
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
      }
    } catch (error) {
      console.error('Failed to toggle tool status:', error);
    }
    setOpenMenuId(null);
  };

  // Filter tools
  const filteredTools = tools.filter((tool) => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || tool.status === statusFilter;
    const matchesCategory = !categoryFilter || tool.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const statusCounts = {
    all: tools.length,
    active: tools.filter(t => t.status === 'active').length,
    draft: tools.filter(t => t.status === 'draft').length,
    inactive: tools.filter(t => t.status === 'inactive').length,
    archived: tools.filter(t => t.status === 'archived').length,
  };

  if (isLoading) {
    return (
      <DashboardLayout variant="admin">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-mojitax-green" />
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
      </div>

      {/* Filters Bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Input
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            {/* Filters */}
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

              {/* View Toggle */}
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
            <button
              onClick={() => setStatusFilter('')}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                !statusFilter ? 'bg-mojitax-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({statusCounts.all})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                statusFilter === 'active' ? 'bg-mojitax-green text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Live ({statusCounts.active})
            </button>
            <button
              onClick={() => setStatusFilter('draft')}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                statusFilter === 'draft' ? 'bg-slate-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Draft ({statusCounts.draft})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                statusFilter === 'inactive' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Inactive ({statusCounts.inactive})
            </button>
            <button
              onClick={() => setStatusFilter('archived')}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                statusFilter === 'archived' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Archived ({statusCounts.archived})
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Tools Grid/List */}
      {filteredTools.length === 0 ? (
        <EmptyState
          icon={searchQuery || statusFilter || categoryFilter ? Wrench : FolderOpen}
          title={searchQuery || statusFilter || categoryFilter ? "No tools found" : "No tools uploaded yet"}
          description={searchQuery || statusFilter || categoryFilter
            ? "Try adjusting your search or filters"
            : "Tools will appear here once developers upload them to the platform. You'll then be able to categorise, describe, and activate them for users."
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map((tool) => (
            <div key={tool.id} className="relative group">
              <div onClick={() => openEditModal(tool)} className="cursor-pointer">
                <ToolCard tool={tool} variant="admin" showStatus />
              </div>

              {/* Actions Menu */}
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
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setOpenMenuId(null)}
                      />
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
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Type</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Category</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Updated</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTools.map((tool) => (
                  <tr key={tool.id} className="border-b border-slate-100 hover:bg-slate-50">
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
                      {tool.category?.replace('_', ' ') || '-'}
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

      {/* Legend */}
      <div className="mt-6 flex items-center gap-4 text-xs text-slate-500">
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
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsEditModalOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-semibold text-mojitax-navy">
                  Edit Tool
                </h2>
                <p className="text-sm text-slate-500">{editingTool.slug}</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4 overflow-y-auto max-h-[50vh]">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name
                </label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Tool name"
                />
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Short Description
                </label>
                <textarea
                  value={editForm.shortDescription}
                  onChange={(e) => setEditForm({ ...editForm, shortDescription: e.target.value })}
                  placeholder="Brief description of the tool"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mojitax-green/50 focus:border-mojitax-green resize-none"
                  rows={3}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Category
                </label>
                <Select
                  options={categoryOptions.filter(o => o.value !== '')}
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value as ToolCategory })}
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Status
                </label>
                <Select
                  options={statusOptions.filter(o => o.value !== '')}
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as ToolStatus })}
                />
              </div>
            </div>

            {/* Footer */}
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
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={saveTool}
                  disabled={isSaving}
                >
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
    </DashboardLayout>
  );
}
