import Link from 'next/link';
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
  ArrowRight,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import type { Tool, ToolCategory } from '@/types';

// Mock data for demo - will be replaced with database queries
const mockTools: Tool[] = [
  {
    id: 'tp-margin-calculator',
    name: 'TP Margin Calculator',
    slug: 'tp-margin-calculator',
    toolType: 'calculator',
    category: 'transfer_pricing',
    shortDescription: 'Calculate gross margins, operating margins, and markups for transfer pricing analysis.',
    status: 'active',
    isPublic: true,
    isPremium: true,
    version: '1.0',
    config: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'vat-calculator',
    name: 'VAT Calculator',
    slug: 'vat-calculator',
    toolType: 'calculator',
    category: 'vat',
    shortDescription: 'Calculate VAT amounts from net or gross figures with support for multiple rates.',
    status: 'active',
    isPublic: true,
    isPremium: true,
    version: '1.0',
    config: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'vat-rate-lookup',
    name: 'VAT Rate Lookup',
    slug: 'vat-rate-lookup',
    toolType: 'search',
    category: 'vat',
    shortDescription: 'Search and compare VAT rates across different countries and regions.',
    status: 'active',
    isPublic: true,
    isPremium: true,
    version: '1.0',
    config: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'eu-vat-validator',
    name: 'EU VAT Number Validator',
    slug: 'eu-vat-validator',
    toolType: 'validator',
    category: 'vat',
    shortDescription: 'Validate EU VAT number formats and understand the structure of VAT IDs.',
    status: 'active',
    isPublic: true,
    isPremium: true,
    version: '1.0',
    config: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'giin-search',
    name: 'GIIN Search Demo',
    slug: 'giin-search',
    toolType: 'search',
    category: 'fatca_crs',
    shortDescription: 'Practice searching FFI data and understanding GIIN structure.',
    status: 'active',
    isPublic: true,
    isPremium: true,
    version: '1.0',
    config: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'treaty-rate-search',
    name: 'Treaty Rate Search',
    slug: 'treaty-rate-search',
    toolType: 'search',
    category: 'withholding_tax',
    shortDescription: 'Look up withholding tax rates under tax treaties between countries.',
    status: 'active',
    isPublic: true,
    isPremium: true,
    version: '1.0',
    config: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const categories: { id: ToolCategory; name: string; tools: Tool[] }[] = [
  { id: 'transfer_pricing', name: 'Transfer Pricing', tools: mockTools.filter(t => t.category === 'transfer_pricing') },
  { id: 'vat', name: 'VAT / Indirect Tax', tools: mockTools.filter(t => t.category === 'vat') },
  { id: 'fatca_crs', name: 'FATCA / CRS', tools: mockTools.filter(t => t.category === 'fatca_crs') },
  { id: 'withholding_tax', name: 'Withholding Tax & Treaties', tools: mockTools.filter(t => t.category === 'withholding_tax') },
];

const toolTypeIcons: Record<string, React.ReactNode> = {
  calculator: <Calculator className="w-5 h-5" />,
  search: <Search className="w-5 h-5" />,
  validator: <CheckCircle className="w-5 h-5" />,
  generator: <FileText className="w-5 h-5" />,
  tracker: <TrendingUp className="w-5 h-5" />,
  reference: <BookOpen className="w-5 h-5" />,
  'external-link': <ExternalLink className="w-5 h-5" />,
};

const toolTypeColors: Record<string, string> = {
  calculator: 'bg-blue-100 text-blue-600',
  search: 'bg-purple-100 text-purple-600',
  validator: 'bg-green-100 text-green-600',
  generator: 'bg-orange-100 text-orange-600',
  tracker: 'bg-pink-100 text-pink-600',
  reference: 'bg-cyan-100 text-cyan-600',
  'external-link': 'bg-slate-100 text-slate-600',
};

export default function PublicToolsPage() {
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
            <Link href="https://mojitax.co.uk/courses">
              <Button size="lg" className="bg-mojitax-green hover:bg-mojitax-green-dark text-white">
                <GraduationCap className="w-5 h-5" />
                Browse Courses
              </Button>
            </Link>
            <Link href="#tools">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Preview Tools
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Tools Section */}
      <section id="tools" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-mojitax-navy mb-4">
              Demo Tools by Category
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              These demo tools are included with MojiTax professional courses. 
              Get access by enrolling in the relevant course.
            </p>
          </div>
          
          {categories.map((category) => (
            category.tools.length > 0 && (
              <div key={category.id} className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <h3 className="text-xl font-semibold text-mojitax-navy">
                    {category.name}
                  </h3>
                  <Badge variant="default" size="sm">
                    {category.tools.length} tools
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
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${toolTypeColors[tool.toolType]}`}>
                              {toolTypeIcons[tool.toolType]}
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
            )
          ))}
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <GraduationCap className="w-12 h-12 text-mojitax-green mx-auto mb-6" />
          <h2 className="text-2xl md:text-3xl font-bold text-mojitax-navy mb-4">
            Get Access to All Demo Tools
          </h2>
          <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
            These demo tools are included with MojiTax professional courses. 
            Enroll in a course to access the full toolset and start practicing real-world tax scenarios.
          </p>
          <Link href="https://mojitax.co.uk/courses">
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
