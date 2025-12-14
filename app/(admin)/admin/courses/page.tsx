'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  BookOpen,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Wrench,
  ArrowLeft,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Package,
  CreditCard,
  Layers,
} from 'lucide-react';

// Product type filter options
type ProductTypeFilter = 'all' | 'course' | 'bundle' | 'subscription';

const productTypeConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  course: { icon: <BookOpen className="w-4 h-4" />, label: 'Course', color: 'bg-blue-100 text-blue-600' },
  bundle: { icon: <Package className="w-4 h-4" />, label: 'Bundle', color: 'bg-purple-100 text-purple-600' },
  subscription: { icon: <CreditCard className="w-4 h-4" />, label: 'Subscription', color: 'bg-green-100 text-green-600' },
};

interface LearnWorldsProduct {
  id: string;
  title: string;
  type: string;
}

interface ConnectionStatus {
  success: boolean;
  configured: boolean;
  message: string;
  courseCount?: number;
  courses?: LearnWorldsProduct[];
  missing?: string[];
}

interface ToolItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: string;
  shortDescription?: string;
}

const ITEMS_PER_PAGE = 10;

export default function AdminCoursesPage() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<ProductTypeFilter>('all');

  // Tool allocation modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<LearnWorldsProduct | null>(null);
  const [availableTools, setAvailableTools] = useState<ToolItem[]>([]);
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingTools, setIsLoadingTools] = useState(false);
  const [courseAllocations, setCourseAllocations] = useState<Record<string, string[]>>({});

  const testConnection = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/learnworlds/test');
      const data = await response.json();
      setConnectionStatus(data);
    } catch (error) {
      setConnectionStatus({
        success: false,
        configured: false,
        message: 'Failed to connect to API',
      });
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  // Filter products based on search query and type filter
  const filteredProducts = useMemo(() => {
    if (!connectionStatus?.courses) return [];

    let filtered = connectionStatus.courses;

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((product) => product.type === typeFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.title.toLowerCase().includes(query) ||
          product.id.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [connectionStatus?.courses, searchQuery, typeFilter]);

  // Get counts by type
  const typeCounts = useMemo(() => {
    if (!connectionStatus?.courses) return { all: 0, course: 0, bundle: 0, subscription: 0 };
    const products = connectionStatus.courses;
    return {
      all: products.length,
      course: products.filter(p => p.type === 'course').length,
      bundle: products.filter(p => p.type === 'bundle').length,
      subscription: products.filter(p => p.type === 'subscription').length,
    };
  }, [connectionStatus?.courses]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter]);

  // Fetch available tools
  const fetchTools = useCallback(async () => {
    setIsLoadingTools(true);
    try {
      const response = await fetch('/api/admin/tools');
      const data = await response.json();
      if (data.tools) {
        setAvailableTools(data.tools);
      }
    } catch (error) {
      console.error('Failed to fetch tools:', error);
    } finally {
      setIsLoadingTools(false);
    }
  }, []);

  // Fetch allocated tools for a course
  const fetchAllocatedTools = useCallback(async (courseId: string) => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/tools`);
      const data = await response.json();
      if (data.success && data.toolIds) {
        setCourseAllocations(prev => ({ ...prev, [courseId]: data.toolIds }));
        return data.toolIds;
      }
    } catch (error) {
      console.error('Failed to fetch allocated tools:', error);
    }
    return [];
  }, []);

  // Open modal for a course
  const openAllocationModal = async (course: LearnWorldsProduct) => {
    setSelectedCourse(course);
    setIsModalOpen(true);

    // Fetch tools if not already loaded
    if (availableTools.length === 0) {
      await fetchTools();
    }

    // Fetch current allocations for this course
    const allocatedIds = await fetchAllocatedTools(course.id);
    setSelectedToolIds(allocatedIds);
  };

  // Toggle tool selection
  const toggleToolSelection = (toolId: string) => {
    setSelectedToolIds(prev =>
      prev.includes(toolId)
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    );
  };

  // Save allocations
  const saveAllocations = async () => {
    if (!selectedCourse) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/courses/${selectedCourse.id}/tools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolIds: selectedToolIds }),
      });

      const data = await response.json();
      if (data.success) {
        setCourseAllocations(prev => ({ ...prev, [selectedCourse.id]: selectedToolIds }));
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to save allocations:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Get allocation count for a course
  const getAllocationCount = (courseId: string) => {
    return courseAllocations[courseId]?.length || 0;
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
              Course &amp; Product Management
            </h1>
          </div>
          <p className="text-slate-600">
            View products from LearnWorlds and allocate tools to courses. Users access courses via direct purchase, bundle, or subscription.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={testConnection}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Refresh
        </Button>
      </div>

      {/* Connection Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-slate-400" />
            LearnWorlds Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-3 py-4">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              <span className="text-slate-600">Testing connection...</span>
            </div>
          ) : connectionStatus?.success ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Connected to LearnWorlds</p>
                  <p className="text-sm text-green-600">
                    Found {connectionStatus.courseCount} courses
                  </p>
                </div>
              </div>

              {/* Products from LearnWorlds */}
              {connectionStatus.courses && connectionStatus.courses.length > 0 && (
                <div>
                  {/* Type Filter Tabs */}
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200">
                    <button
                      onClick={() => setTypeFilter('all')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        typeFilter === 'all'
                          ? 'bg-mojitax-green text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Layers className="w-4 h-4 inline mr-2" />
                      All ({typeCounts.all})
                    </button>
                    <button
                      onClick={() => setTypeFilter('course')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        typeFilter === 'course'
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 inline mr-2" />
                      Courses ({typeCounts.course})
                    </button>
                    <button
                      onClick={() => setTypeFilter('bundle')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        typeFilter === 'bundle'
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                      }`}
                    >
                      <Package className="w-4 h-4 inline mr-2" />
                      Bundles ({typeCounts.bundle})
                    </button>
                    <button
                      onClick={() => setTypeFilter('subscription')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        typeFilter === 'subscription'
                          ? 'bg-green-600 text-white'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 inline mr-2" />
                      Subscriptions ({typeCounts.subscription})
                    </button>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-slate-700">
                      {typeFilter === 'all' ? 'All Products' : `${typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}s`} from LearnWorlds
                    </h3>
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mojitax-green/50 focus:border-mojitax-green w-64"
                      />
                    </div>
                  </div>

                  {/* Product List */}
                  <div className="space-y-2">
                    {paginatedProducts.length > 0 ? (
                      paginatedProducts.map((product) => {
                        const config = productTypeConfig[product.type] || productTypeConfig.course;
                        return (
                          <div
                            key={product.id}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.color}`}>
                                {config.icon}
                              </div>
                              <div>
                                <p className="font-medium text-mojitax-navy">{product.title}</p>
                                <p className="text-xs text-slate-500">ID: {product.id}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="active" size="sm" className={config.color}>
                                {config.label}
                              </Badge>
                              {/* Only courses can have tools allocated */}
                              {product.type === 'course' ? (
                                <>
                                  {getAllocationCount(product.id) > 0 && (
                                    <Badge variant="default" size="sm">
                                      {getAllocationCount(product.id)} tools
                                    </Badge>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openAllocationModal(product)}
                                  >
                                    <Wrench className="w-3 h-3" />
                                    Allocate Tools
                                  </Button>
                                </>
                              ) : (
                                <span className="text-xs text-slate-400 italic">
                                  Tools allocated to included courses
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 text-slate-500">
                        No products found matching &quot;{searchQuery}&quot;
                      </div>
                    )}
                  </div>

                  {/* Pagination Controls */}
                  {filteredProducts.length > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                      <p className="text-sm text-slate-600">
                        Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} products
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </Button>
                        <span className="text-sm text-slate-600 px-2">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-800">
                    {connectionStatus?.configured
                      ? 'Connection Failed'
                      : 'LearnWorlds Not Configured'}
                  </p>
                  <p className="text-sm text-amber-600 mt-1">
                    {connectionStatus?.message}
                  </p>
                  {connectionStatus?.missing && connectionStatus.missing.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-amber-800">Missing environment variables:</p>
                      <ul className="mt-1 text-sm text-amber-700 list-disc list-inside">
                        {connectionStatus.missing.map((v) => (
                          <li key={v}>{v}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-slate-700 mb-2">Setup Instructions</h4>
                <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
                  <li>Go to LearnWorlds Admin → Settings → Developers → API</li>
                  <li>Copy your Client ID, Client Secret, and Access Token</li>
                  <li>Add them to your Replit Secrets with these exact names:
                    <ul className="ml-6 mt-1 space-y-1 list-disc">
                      <li><code className="bg-slate-200 px-1 rounded">LEARNWORLDS_SCHOOL_URL</code></li>
                      <li><code className="bg-slate-200 px-1 rounded">LEARNWORLDS_API_URL</code></li>
                      <li><code className="bg-slate-200 px-1 rounded">LEARNWORLDS_CLIENT_ID</code></li>
                      <li><code className="bg-slate-200 px-1 rounded">LEARNWORLDS_CLIENT_SECRET</code></li>
                      <li><code className="bg-slate-200 px-1 rounded">LEARNWORLDS_ACCESS_TOKEN</code></li>
                    </ul>
                  </li>
                  <li>Restart the application and refresh this page</li>
                </ol>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Card */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">How Course-Based Tool Access Works</h4>
        <p className="text-sm text-blue-700 mb-3">
          Tools are allocated to <strong>courses only</strong>. Users gain access to tools by having access to courses -
          whether through direct course purchase, a bundle that includes the course, or a subscription.
        </p>
        <ol className="text-sm text-blue-600 space-y-1 list-decimal list-inside">
          <li>Admin allocates tools to specific <strong>courses</strong> (not bundles or subscriptions)</li>
          <li>Users can access courses via: direct purchase, bundle, or subscription</li>
          <li>When users authenticate, we fetch all courses they can access from LearnWorlds</li>
          <li>Users see tools for any course they have access to, regardless of how they got access</li>
        </ol>
        <p className="text-xs text-blue-500 mt-3 italic">
          Example: If &quot;Tax Calculator&quot; tool is allocated to &quot;VAT Course&quot;, any user who can access that course
          (via direct purchase, a bundle, or subscription) will have access to the tool.
        </p>
      </div>

      {/* Tool Allocation Modal */}
      {isModalOpen && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-semibold text-mojitax-navy">
                  Allocate Tools to Course
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="active" size="sm" className={productTypeConfig[selectedCourse.type]?.color}>
                    {productTypeConfig[selectedCourse.type]?.label || selectedCourse.type}
                  </Badge>
                  <span className="text-sm text-slate-600">{selectedCourse.title}</span>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              {isLoadingTools ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  <span className="ml-2 text-slate-600">Loading tools...</span>
                </div>
              ) : availableTools.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No tools available. Create tools first.
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-slate-600 mb-3">
                    Select the tools that users with access to this course should have. Access can be via direct purchase, bundle, or subscription.
                  </p>
                  {availableTools.map((tool) => (
                    <div
                      key={tool.id}
                      onClick={() => toggleToolSelection(tool.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedToolIds.includes(tool.id)
                          ? 'bg-mojitax-green/10 border-2 border-mojitax-green'
                          : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center ${
                          selectedToolIds.includes(tool.id)
                            ? 'bg-mojitax-green text-white'
                            : 'border-2 border-slate-300'
                        }`}
                      >
                        {selectedToolIds.includes(tool.id) && (
                          <Check className="w-3 h-3" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-mojitax-navy">{tool.name}</p>
                        {tool.shortDescription && (
                          <p className="text-xs text-slate-500">{tool.shortDescription}</p>
                        )}
                      </div>
                      <Badge variant="default" size="sm">
                        {tool.category.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50">
              <p className="text-sm text-slate-600">
                {selectedToolIds.length} tool{selectedToolIds.length !== 1 ? 's' : ''} selected
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={saveAllocations}
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
                      Save Allocations
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
