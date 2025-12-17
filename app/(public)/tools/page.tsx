import Link from 'next/link';
import { PublicHeader } from '@/components/PublicHeader';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getPublicTools } from '@/lib/db';
import { CATEGORY_METADATA } from '@/lib/tools/registry';
import {
  Calculator,
  Search,
  CheckCircle,
  FileText,
  TrendingUp,
  BookOpen,
  ExternalLink,
  ArrowRight,
  GraduationCap,
  Sparkles,
  Table,
  ClipboardList,
  Wrench,
} from 'lucide-react';
import type { Tool, ToolCategory } from '@/types';

const toolTypeIcons: Record<string, React.ReactNode> = {
  calculator: <Calculator className="w-5 h-5" />,
  search: <Search className="w-5 h-5" />,
  validator: <CheckCircle className="w-5 h-5" />,
  generator: <FileText className="w-5 h-5" />,
  tracker: <TrendingUp className="w-5 h-5" />,
  reference: <BookOpen className="w-5 h-5" />,
  'external-link': <ExternalLink className="w-5 h-5" />,
  spreadsheet: <Table className="w-5 h-5" />,
  form: <ClipboardList className="w-5 h-5" />,
};

const toolTypeColors: Record<string, string> = {
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

// Group tools by category
function groupToolsByCategory(tools: Tool[]): { id: ToolCategory; name: string; tools: Tool[] }[] {
  const grouped: Record<string, Tool[]> = {};

  tools.forEach(tool => {
    if (!grouped[tool.category]) {
      grouped[tool.category] = [];
    }
    grouped[tool.category].push(tool);
  });

  return Object.entries(grouped)
    .filter(([_, tools]) => tools.length > 0)
    .map(([category, tools]) => ({
      id: category as ToolCategory,
      name: CATEGORY_METADATA[category]?.name || category,
      tools,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export default async function PublicToolsPage() {
  // Fetch tools from database
  const tools = await getPublicTools();
  const categories = groupToolsByCategory(tools);
  const hasTools = tools.length > 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-mojitax-navy via-mojitax-navy-light to-mojitax-navy py-20">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-mesh-pattern" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="info" className="mb-6 bg-white/10 text-white border border-white/20">
            <Sparkles className="w-3 h-3 mr-1" />
            Demo Tools for Learning
          </Badge>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
            MojiTax Demo Tools
          </h1>

          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
            Practical demo tools for learning international tax concepts.
            Practice calculations, validate formats, and explore reference data in a safe learning environment.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="https://www.mojitax.co.uk/courses-catalogue">
              <Button size="lg" className="bg-mojitax-green hover:bg-mojitax-green-dark text-white">
                <GraduationCap className="w-5 h-5" />
                Browse Courses
              </Button>
            </Link>
            {hasTools && (
              <Link href="#tools">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  View Tools
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section id="tools" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-mojitax-navy mb-4">
              Demo Tools
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              {hasTools
                ? 'These demo tools are included with MojiTax professional courses. Get access by enrolling in the relevant course.'
                : 'Demo tools are currently being developed. Check back soon!'}
            </p>
          </div>

          {!hasTools ? (
            /* Empty State */
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
                  <Wrench className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-mojitax-navy mb-3">
                  Tools Coming Soon
                </h3>
                <p className="text-slate-500 mb-6">
                  We're building practical demo tools for tax professionals.
                  These tools will help you practice real-world tax calculations
                  and scenarios in a safe learning environment.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link href="https://www.mojitax.co.uk/courses-catalogue">
                    <Button variant="primary">
                      <GraduationCap className="w-4 h-4" />
                      Browse Courses
                    </Button>
                  </Link>
                  <Link href="https://mojitax.co.uk">
                    <Button variant="outline">
                      Visit MojiTax
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Tools by Category */
            categories.map((category) => (
              <div key={category.id} className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <h3 className="text-xl font-semibold text-mojitax-navy">
                    {category.name}
                  </h3>
                  <Badge variant="default" size="sm">
                    {category.tools.length} {category.tools.length === 1 ? 'tool' : 'tools'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.tools.map((tool) => (
                    <Link
                      key={tool.id}
                      href={`/tools/${tool.slug}`}
                      className="group"
                    >
                      <Card hover>
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${toolTypeColors[tool.toolType] || 'bg-slate-100 text-slate-600'}`}>
                              {toolTypeIcons[tool.toolType] || <FileText className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-mojitax-navy group-hover:text-mojitax-green-dark transition-colors mb-1">
                                {tool.name}
                              </h4>
                              <p className="text-sm text-slate-500 line-clamp-2">
                                {tool.shortDescription}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs text-slate-400 capitalize">
                              {tool.toolType.replace('-', ' ')}
                            </span>
                            <span className="text-sm font-medium text-mojitax-green-dark flex items-center gap-1 group-hover:gap-2 transition-all">
                              Preview
                              <ArrowRight className="w-4 h-4" />
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <GraduationCap className="w-12 h-12 text-mojitax-green mx-auto mb-6" />
          <h2 className="text-2xl md:text-3xl font-bold text-mojitax-navy mb-4">
            Learn International Tax with MojiTax
          </h2>
          <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
            Access professional tax courses and practical demo tools to enhance your international tax knowledge.
          </p>
          <Link href="https://www.mojitax.co.uk/courses-catalogue">
            <Button size="lg" variant="primary">
              Browse Courses at MojiTax
              <ExternalLink className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200">
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
              <Link href="https://mojitax.co.uk/contact" className="hover:text-mojitax-navy transition-colors">
                Contact
              </Link>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              <strong>Demo Tools for Learning:</strong> These are educational demo tools designed to help you understand tax concepts and practice calculations.
              Results are illustrative only and should not be used for actual tax filings or professional advice.
              Always consult qualified tax professionals for real-world applications.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
