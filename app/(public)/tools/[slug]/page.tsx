import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PublicHeader } from '@/components/PublicHeader';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Logo } from '@/components/ui/Logo';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoginButton } from '@/components/LoginButton';
import { Badge } from '@/components/ui/Badge';
import { ToolPageClient } from '@/components/tools/ToolPageClient';
import { getToolBySlug, getCoursesForTool } from '@/lib/db';
import { CATEGORY_METADATA } from '@/lib/tools/registry';
import { getServerSession, hasToolAccess } from '@/lib/server-session';
import {
  Calculator,
  Search,
  CheckCircle,
  FileText,
  TrendingUp,
  BookOpen,
  ExternalLink,
  Lock,
  ArrowLeft,
  GraduationCap,
  AlertTriangle,
  ArrowRight,
  Table,
  ClipboardList,
} from 'lucide-react';
import type { ToolType } from '@/types';

const toolTypeIcons: Record<ToolType, React.ReactNode> = {
  calculator: <Calculator className="w-6 h-6" />,
  search: <Search className="w-6 h-6" />,
  validator: <CheckCircle className="w-6 h-6" />,
  generator: <FileText className="w-6 h-6" />,
  tracker: <TrendingUp className="w-6 h-6" />,
  reference: <BookOpen className="w-6 h-6" />,
  'external-link': <ExternalLink className="w-6 h-6" />,
  spreadsheet: <Table className="w-6 h-6" />,
  form: <ClipboardList className="w-6 h-6" />,
};

const toolTypeColors: Record<ToolType, string> = {
  calculator: 'bg-blue-100 text-blue-600',
  search: 'bg-purple-100 text-purple-600',
  validator: 'bg-green-100 text-green-600',
  generator: 'bg-orange-100 text-orange-600',
  tracker: 'bg-pink-100 text-pink-600',
  reference: 'bg-cyan-100 text-cyan-600',
  'external-link': 'bg-slate-100 text-slate-600',
  spreadsheet: 'bg-emerald-100 text-emerald-600',
  form: 'bg-indigo-100 text-indigo-600',
};

interface ToolPageProps {
  params: { slug: string };
}

export default async function ToolPage({ params }: ToolPageProps) {
  // Fetch tool from database
  const tool = await getToolBySlug(params.slug);

  if (!tool || tool.status !== 'active') {
    notFound();
  }

  // Get session and check access
  const session = await getServerSession();
  const isAuthenticated = !!session;
  const canAccessTool = await hasToolAccess(tool.id);

  // Fetch courses that include this tool (from LearnWorlds allocations)
  const courses = await getCoursesForTool(tool.id);

  // If authenticated AND has access, render the tool
  if (isAuthenticated && canAccessTool) {
    return (
      <DashboardLayout>
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-mojitax-navy transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        {/* Tool Disclaimer */}
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800 mb-1">Demo Tool for Learning</p>
            <p className="text-sm text-amber-700">
              This is an educational demo tool. Results are illustrative only and should not be used for actual tax filings or professional advice.
            </p>
          </div>
        </div>

        {/* Tool Component */}
        <ToolPageClient tool={tool} />
      </DashboardLayout>
    );
  }

  // Authenticated but no access - show locked state in dashboard
  if (isAuthenticated && !canAccessTool) {
    return (
      <DashboardLayout>
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-mojitax-navy transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        {/* Tool Header */}
        <div className="flex items-start gap-6 mb-8">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 opacity-50 ${toolTypeColors[tool.toolType]}`}>
            {toolTypeIcons[tool.toolType]}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="warning" size="sm">
                <Lock className="w-3 h-3 mr-1" />
                Locked
              </Badge>
              <Badge variant="default" size="sm" className="capitalize">
                {tool.toolType.replace('-', ' ')}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold text-mojitax-navy mb-2">
              {tool.name}
            </h1>
            <p className="text-lg text-slate-600">
              {tool.shortDescription}
            </p>
          </div>
        </div>

        {/* Locked State */}
        <Card className="mb-8 overflow-hidden border-amber-200">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold text-mojitax-navy mb-2">
              Tool Access Required
            </h2>
            <p className="text-slate-600 mb-6 max-w-lg mx-auto">
              You need to be enrolled in a course that includes this tool.
              Enroll in one of the courses below to unlock access.
            </p>

            {courses.length > 0 ? (
              <div className="space-y-3 max-w-md mx-auto mb-6">
                {courses.map((course) => (
                  <a
                    key={course.id}
                    href={course.learnworldsUrl || `https://www.mojitax.co.uk/course/${course.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200 hover:border-mojitax-green/30 hover:shadow-md transition-all group"
                  >
                    <GraduationCap className="w-6 h-6 text-mojitax-green flex-shrink-0" />
                    <span className="text-sm font-medium text-mojitax-navy group-hover:text-mojitax-green-dark transition-colors flex-1 text-left">
                      {course.name}
                    </span>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-mojitax-green transition-colors" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 mb-6">
                No courses currently offer this tool. Check back later or contact support.
              </p>
            )}

            <a href="https://www.mojitax.co.uk/courses" target="_blank" rel="noopener noreferrer">
              <Button variant="primary" size="lg">
                <GraduationCap className="w-5 h-5" />
                Browse All Courses
              </Button>
            </a>
          </div>
        </Card>

        {/* Tool Description (read-only preview) */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-mojitax-navy mb-4">
              About This Tool
            </h3>
            <div className="prose prose-slate max-w-none text-slate-600">
              <p>{tool.shortDescription}</p>
              {tool.description && (
                <p className="mt-2 text-sm">{tool.description.slice(0, 300)}...</p>
              )}
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  // Public preview for unauthenticated users
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <PublicHeader />

      {/* Breadcrumb */}
      <div className="border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-mojitax-navy transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Tools
          </Link>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tool Header */}
            <div className="flex items-start gap-6 mb-8">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 ${toolTypeColors[tool.toolType]}`}>
                {toolTypeIcons[tool.toolType]}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="info" size="sm">
                    Demo Tool
                  </Badge>
                  <Badge variant="default" size="sm" className="capitalize">
                    {tool.toolType.replace('-', ' ')}
                  </Badge>
                </div>
                <h1 className="text-3xl font-bold text-mojitax-navy mb-2">
                  {tool.name}
                </h1>
                <p className="text-lg text-slate-600">
                  {tool.shortDescription}
                </p>
              </div>
            </div>

            {/* Tool Preview/Screenshot */}
            <Card className="mb-8 overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-mesh-pattern opacity-50" />
                <div className="relative text-center p-8">
                  <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${toolTypeColors[tool.toolType]}`}>
                    {toolTypeIcons[tool.toolType]}
                  </div>
                  <p className="text-slate-600 mb-4">
                    Tool preview will be shown here
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                    <Lock className="w-4 h-4" />
                    Log in to access full tool
                  </div>
                </div>
              </div>
            </Card>

            {/* Tool Description */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-mojitax-navy mb-4">
                About This Demo Tool
              </h2>
              <div className="prose prose-slate max-w-none">
                {tool.description?.split('\n\n').map((paragraph, i) => {
                  // Handle markdown headers
                  if (paragraph.startsWith('## ')) {
                    return (
                      <h3 key={i} className="text-lg font-semibold text-mojitax-navy mt-6 mb-3">
                        {paragraph.replace('## ', '')}
                      </h3>
                    );
                  }
                  if (paragraph.startsWith('### ')) {
                    return (
                      <h4 key={i} className="text-md font-semibold text-mojitax-navy mt-4 mb-2">
                        {paragraph.replace('### ', '')}
                      </h4>
                    );
                  }
                  // Handle blockquotes
                  if (paragraph.startsWith('> ')) {
                    return (
                      <blockquote key={i} className="border-l-4 border-mojitax-green pl-4 py-2 my-4 bg-slate-50 rounded-r-lg">
                        <p className="text-slate-600 italic">
                          {paragraph.replace('> ', '').replace(/\*\*(.+?)\*\*/g, '$1')}
                        </p>
                      </blockquote>
                    );
                  }
                  // Handle bullet lists
                  if (paragraph.startsWith('- ')) {
                    const items = paragraph.split('\n').filter(item => item.startsWith('- '));
                    return (
                      <ul key={i} className="space-y-2 my-4">
                        {items.map((item, j) => (
                          <li key={j} className="text-slate-600 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-mojitax-green mt-2 flex-shrink-0" />
                            <span dangerouslySetInnerHTML={{
                              __html: item.replace(/^-\s*/, '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                            }} />
                          </li>
                        ))}
                      </ul>
                    );
                  }
                  return (
                    <p key={i} className="text-slate-600 mb-4">
                      {paragraph}
                    </p>
                  );
                })}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 mb-1">Demo Tool for Learning</p>
                <p className="text-sm text-amber-700">
                  This is an educational demo tool. Results are illustrative only and should not be used for actual tax filings or professional advice.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Access Card */}
            <Card className="mb-6 overflow-hidden">
              <div className="bg-gradient-to-br from-mojitax-navy to-mojitax-navy-light p-6 text-white">
                <Lock className="w-8 h-8 mb-3 opacity-80" />
                <h3 className="text-lg font-semibold mb-2">
                  Access This Demo Tool
                </h3>
                <p className="text-sm text-white/80 mb-4">
                  {courses.length > 0
                    ? 'This tool is included with the following MojiTax courses:'
                    : 'Log in to access this demo tool.'}
                </p>
              </div>
              <CardContent className="p-6">
                {courses.length > 0 && (
                  <div className="space-y-3 mb-6">
                    {courses.map((course) => (
                      <Link
                        key={course.id}
                        href={course.learnworldsUrl || `https://mojitax.co.uk/course/${course.slug}`}
                        className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-mojitax-green/30 hover:bg-slate-50 transition-all group"
                      >
                        <GraduationCap className="w-5 h-5 text-mojitax-green flex-shrink-0" />
                        <span className="text-sm font-medium text-mojitax-navy group-hover:text-mojitax-green-dark transition-colors flex-1">
                          {course.name}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-mojitax-green group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    ))}
                  </div>
                )}

                <div className={courses.length > 0 ? "border-t border-slate-200 pt-4" : ""}>
                  <p className="text-sm text-slate-500 mb-4">
                    Already enrolled?
                  </p>
                  <LoginButton variant="primary" className="w-full">
                    Log In to Access
                  </LoginButton>
                </div>
              </CardContent>
            </Card>

            {/* Tool Info */}
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-mojitax-navy mb-4">Tool Information</h4>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-sm text-slate-500">Type</dt>
                    <dd className="text-sm font-medium text-mojitax-navy capitalize">
                      {tool.toolType.replace('-', ' ')}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-slate-500">Category</dt>
                    <dd className="text-sm font-medium text-mojitax-navy">
                      {CATEGORY_METADATA[tool.category]?.name || tool.category.replace('_', ' ')}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-slate-500">Version</dt>
                    <dd className="text-sm font-medium text-mojitax-navy">
                      {tool.version}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Logo size="sm" />
              <span className="text-sm text-slate-500">
                © {new Date().getFullYear()} MojiTax. All rights reserved.
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <Link href="https://mojitax.co.uk/privacy" className="hover:text-mojitax-navy transition-colors">
                Privacy
              </Link>
              <Link href="https://mojitax.co.uk/terms" className="hover:text-mojitax-navy transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export async function generateMetadata({ params }: ToolPageProps) {
  const tool = await getToolBySlug(params.slug);

  if (!tool) {
    return {
      title: 'Tool Not Found',
    };
  }

  return {
    title: `${tool.name} | MojiTax Demo Tools`,
    description: tool.shortDescription,
  };
}
