import Link from 'next/link';
import { PublicHeader } from '@/components/PublicHeader';
import { PublicToolsFilter } from '@/components/PublicToolsFilter';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getPublicTools } from '@/lib/db';
import {
  ExternalLink,
  GraduationCap,
  Sparkles,
  Wrench,
} from 'lucide-react';

export default async function PublicToolsPage() {
  // Fetch tools from database
  const tools = await getPublicTools();
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
                  We&apos;re building practical demo tools for tax professionals.
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
            <PublicToolsFilter tools={tools} />
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
