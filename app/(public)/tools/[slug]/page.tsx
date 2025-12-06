import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
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
} from 'lucide-react';
import type { Tool, ToolType } from '@/types';

// Mock tool data - will be replaced with database query
const mockTools: Record<string, Tool> = {
  'tp-margin-calculator': {
    id: 'tp-margin-calculator',
    name: 'TP Margin Calculator',
    slug: 'tp-margin-calculator',
    toolType: 'calculator',
    category: 'transfer_pricing',
    shortDescription: 'Calculate gross margins, operating margins, and markups for transfer pricing analysis.',
    description: `This demo tool helps you understand how transfer pricing professionals calculate arm's length margins. Practice with different scenarios to learn:

- **Gross Profit Margin**: Revenue minus COGS, divided by revenue. Used in the Resale Price Method.
- **Operating Margin**: Revenue minus COGS minus operating expenses, divided by revenue. The primary PLI for TNMM.
- **Cost Plus Markup**: Gross profit divided by COGS. Used in the Cost Plus Method.
- **Berry Ratio**: Gross profit divided by operating expenses. Useful for distributors.

Enter sample financial data to see how each margin is calculated and understand when different metrics are appropriate for transfer pricing analysis.`,
    status: 'active',
    isPublic: true,
    isPremium: true,
    version: '1.0',
    config: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  'vat-calculator': {
    id: 'vat-calculator',
    name: 'VAT Calculator',
    slug: 'vat-calculator',
    toolType: 'calculator',
    category: 'vat',
    shortDescription: 'Calculate VAT amounts from net or gross figures with support for multiple rates.',
    description: `Practice VAT calculations with this demo tool. Learn to calculate VAT in both directions:

- **Net to Gross**: Add VAT to a net amount
- **Gross to Net**: Extract VAT from a gross amount

Support for standard, reduced, and custom VAT rates helps you understand how different rates affect final prices and tax liabilities.`,
    status: 'active',
    isPublic: true,
    isPremium: true,
    version: '1.0',
    config: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

// Mock courses that include tools
const toolCourses: Record<string, { name: string; url: string }[]> = {
  'tp-margin-calculator': [
    { name: 'Transfer Pricing Fundamentals', url: 'https://mojitax.co.uk/course/tp-fundamentals' },
    { name: 'Transfer Pricing Professional Bundle', url: 'https://mojitax.co.uk/bundle/tp-professional' },
  ],
  'vat-calculator': [
    { name: 'VAT Compliance Masterclass', url: 'https://mojitax.co.uk/course/vat-masterclass' },
    { name: 'EU VAT for E-commerce', url: 'https://mojitax.co.uk/course/eu-vat-ecommerce' },
  ],
};

const toolTypeIcons: Record<ToolType, React.ReactNode> = {
  calculator: <Calculator className="w-6 h-6" />,
  search: <Search className="w-6 h-6" />,
  validator: <CheckCircle className="w-6 h-6" />,
  generator: <FileText className="w-6 h-6" />,
  tracker: <TrendingUp className="w-6 h-6" />,
  reference: <BookOpen className="w-6 h-6" />,
  'external-link': <ExternalLink className="w-6 h-6" />,
  spreadsheet: <Calculator className="w-6 h-6" />,
  form: <FileText className="w-6 h-6" />,
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

interface ToolPreviewPageProps {
  params: { slug: string };
}

export default function ToolPreviewPage({ params }: ToolPreviewPageProps) {
  const tool = mockTools[params.slug];
  
  if (!tool) {
    notFound();
  }
  
  const courses = toolCourses[params.slug] || [];
  
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo size="md" />
            <div className="flex items-center gap-4">
              <Link
                href="https://mojitax.co.uk"
                className="text-sm text-slate-600 hover:text-mojitax-navy transition-colors"
              >
                Back to MojiTax
              </Link>
              <Button variant="primary" size="sm">
                Log In
              </Button>
            </div>
          </div>
        </div>
      </header>
      
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
                  if (paragraph.startsWith('-')) {
                    const items = paragraph.split('\n').filter(item => item.startsWith('-'));
                    return (
                      <ul key={i} className="space-y-2">
                        {items.map((item, j) => (
                          <li key={j} className="text-slate-600">
                            {item.replace(/^-\s*\*\*(.+)\*\*:/, (_, title) => `**${title}**:`).replace(/^\s*-\s*/, '')}
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
                  This tool is included with the following MojiTax courses:
                </p>
              </div>
              <CardContent className="p-6">
                <div className="space-y-3 mb-6">
                  {courses.map((course, i) => (
                    <Link
                      key={i}
                      href={course.url}
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
                
                <div className="border-t border-slate-200 pt-4">
                  <p className="text-sm text-slate-500 mb-4">
                    Already enrolled?
                  </p>
                  <Button variant="primary" className="w-full">
                    Log In to Access
                  </Button>
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
                    <dd className="text-sm font-medium text-mojitax-navy capitalize">
                      {tool.category?.replace('_', ' ') || 'General'}
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

export async function generateMetadata({ params }: ToolPreviewPageProps) {
  const tool = mockTools[params.slug];
  
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
