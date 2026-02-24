import Link from 'next/link';
import { PublicHeader } from '@/components/PublicHeader';
import { CourseToolsList } from '@/components/CourseToolsList';
import { Logo } from '@/components/ui/Logo';
import { getCoursesWithToolDetails } from '@/lib/db';
import {
  GraduationCap,
  ClipboardCheck,
  QrCode,
  FileText,
  Target,
  BarChart3,
  ArrowRight,
} from 'lucide-react';

export default async function PublicToolsPage() {
  const coursesWithTools = await getCoursesWithToolDetails();
  const hasCourses = coursesWithTools.length > 0;
  const totalToolCount = coursesWithTools.reduce((sum, c) => sum + c.tools.length, 0);

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* ══════════════════════════════════════
          SECTION 1: HERO
          ══════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/50 to-slate-100 border-b border-slate-200 py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 items-center">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-[38px] font-bold text-mojitax-navy mb-4 leading-tight tracking-tight">
                International Tax Practice Simulator
              </h1>
              <p className="text-base md:text-lg text-slate-500 leading-relaxed max-w-2xl">
                MojiTax Tools is where theory becomes practice. Work through real-world tax forms, filings, and scenarios used by professionals. Measure your progress with a downloadable Skills Matrix that benchmarks your competence and can be verified by employers.
              </p>
            </div>
            <div className="flex flex-row lg:flex-col gap-3 flex-wrap lg:flex-nowrap flex-shrink-0">
              <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl shadow-sm border-l-[3px] border-l-mojitax-navy whitespace-nowrap">
                <ClipboardCheck className="w-5 h-5 text-mojitax-navy flex-shrink-0" />
                <span className="text-sm font-semibold text-mojitax-navy">Real-World Practice</span>
              </div>
              <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl shadow-sm border-l-[3px] border-l-mojitax-navy whitespace-nowrap">
                <BarChart3 className="w-5 h-5 text-mojitax-navy flex-shrink-0" />
                <span className="text-sm font-semibold text-mojitax-navy">Skills Matrix</span>
              </div>
              <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl shadow-sm border-l-[3px] border-l-mojitax-navy whitespace-nowrap">
                <QrCode className="w-5 h-5 text-mojitax-navy flex-shrink-0" />
                <span className="text-sm font-semibold text-mojitax-navy">QR Code Verification</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SECTION 2: WHAT YOU PRACTICE
          ══════════════════════════════════════ */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[2px] text-orange-500 mb-3">
            Practice Areas
          </p>
          <h2 className="text-2xl md:text-[28px] font-bold text-mojitax-navy mb-2">
            What you do inside MojiTax Tools
          </h2>
          <p className="text-base text-slate-500 leading-relaxed max-w-2xl mb-10">
            Tools is built around the same workflows used by tax professionals. Each scenario takes you through a complete process from start to finish.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 rounded-2xl p-8 border-t-4 border-t-blue-600 hover:-translate-y-1 hover:shadow-lg hover:bg-white transition-all duration-300">
              <FileText className="w-7 h-7 text-blue-600 mb-4" />
              <h3 className="text-lg font-bold text-mojitax-navy mb-2">Forms &amp; Filings</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Complete the same tax forms and filings used in professional practice. Work through each field, understand requirements, submit for assessment.
              </p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-8 border-t-4 border-t-orange-500 hover:-translate-y-1 hover:shadow-lg hover:bg-white transition-all duration-300">
              <Target className="w-7 h-7 text-orange-500 mb-4" />
              <h3 className="text-lg font-bold text-mojitax-navy mb-2">Real-World Scenarios</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Each scenario simulates a professional engagement &mdash; a client situation, compliance deadline, or advisory task. Work through the problem the way a professional would.
              </p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-8 border-t-4 border-t-emerald-600 hover:-translate-y-1 hover:shadow-lg hover:bg-white transition-all duration-300">
              <BarChart3 className="w-7 h-7 text-emerald-600 mb-4" />
              <h3 className="text-lg font-bold text-mojitax-navy mb-2">Skills Evaluation</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Track progress as you complete scenarios. The platform records topics covered, competence level, and generates a benchmarked assessment of practical skills.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SECTION 3: COURSES & SKILLS MATRIX (SIDE-BY-SIDE)
          ══════════════════════════════════════ */}
      <section className="py-16 md:py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">

            {/* LEFT: Courses & Tools */}
            <div>
              <p className="text-xs font-bold uppercase tracking-[2px] text-orange-500 mb-3">
                Courses &amp; Tools
              </p>
              <h2 className="text-2xl md:text-[28px] font-bold text-mojitax-navy mb-2">
                Professional Practice Courses
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed mb-8">
                Each course includes hands-on tools. Click a course to see its tools. As new tools are developed they appear here automatically.
              </p>

              <CourseToolsList courses={coursesWithTools} />
            </div>

            {/* RIGHT: Skills Matrix */}
            <div className="lg:sticky lg:top-8">
              <p className="text-xs font-bold uppercase tracking-[2px] text-orange-500 mb-3">
                Your Credential
              </p>
              <h2 className="text-2xl md:text-[28px] font-bold text-mojitax-navy mb-2">
                The Skills Matrix
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed mb-8">
                A detailed record of your practical competence, generated from your work inside MojiTax Tools.
              </p>

              {/* Skills Matrix Card */}
              <div className="bg-white rounded-xl border-t-[3px] border-t-violet-600 shadow-sm overflow-hidden">
                {/* Side panel accent */}
                <div className="bg-violet-50 flex items-center justify-center py-6">
                  <div className="text-center">
                    <div className="text-5xl mb-2">&#128196;</div>
                    <h4 className="text-sm font-bold text-mojitax-navy">Verifiable Credential</h4>
                    <p className="text-xs font-semibold text-violet-600">QR code validated</p>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6">
                  <h3 className="text-base font-bold text-mojitax-navy mb-2">
                    Downloadable Skills Matrix
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4">
                    Every scenario you complete contributes to your Skills Matrix &mdash; mapping your competence across international tax topics.
                  </p>
                  <ul className="space-y-2.5">
                    {[
                      'Topics covered and competence level per area',
                      'Study hours and completion dates',
                      'Tools and forms practised',
                      'QR code for employer verification',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-mojitax-navy">
                        <span className="text-violet-600 font-bold text-sm leading-5 flex-shrink-0">&#10003;</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed mt-4">
                Employers and professional bodies can scan the QR code to verify your Skills Matrix directly.
              </p>

              {/* Quick stats */}
              {hasCourses && (
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                    <p className="text-2xl font-bold text-mojitax-navy">{coursesWithTools.length}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{coursesWithTools.length === 1 ? 'Course' : 'Courses'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                    <p className="text-2xl font-bold text-mojitax-navy">{totalToolCount}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{totalToolCount === 1 ? 'Tool' : 'Tools'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SECTION 4: HOW TO ACCESS
          ══════════════════════════════════════ */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[2px] text-orange-500 mb-3">
            Access
          </p>
          <h2 className="text-2xl md:text-[28px] font-bold text-mojitax-navy mb-2">
            How to access MojiTax Tools
          </h2>
          <p className="text-base text-slate-500 leading-relaxed max-w-2xl mb-10">
            Tools is included with Professional Practice courses. There are two ways to get access.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-slate-50 rounded-2xl p-8 border-t-4 border-t-violet-600 hover:-translate-y-1 hover:shadow-lg hover:bg-white transition-all duration-300">
              <h3 className="text-lg font-bold text-mojitax-navy mb-2">
                Purchase a Professional Practice course
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">
                Buy any Professional Practice course (ADIT Thematic, CTA Advanced Technical, EA, or Pillar Two). Access to Tools is included for the duration of your course access.
              </p>
              <p className="text-xl font-bold text-mojitax-navy mb-3">From &pound;500</p>
              <Link
                href="https://www.mojitax.co.uk/courses-catalogue"
                className="text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors inline-flex items-center gap-1"
              >
                Browse courses <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-slate-50 rounded-2xl p-8 border-t-4 border-t-blue-600 hover:-translate-y-1 hover:shadow-lg hover:bg-white transition-all duration-300">
              <h3 className="text-lg font-bold text-mojitax-navy mb-2">
                Subscribe to Professional
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">
                The Professional subscription (&pound;100/mo) includes all courses, including all Professional Practice courses. Full Tools access included. 7-day free trial available.
              </p>
              <p className="text-xl font-bold text-mojitax-navy mb-3">&pound;100/mo</p>
              <Link
                href="https://www.mojitax.co.uk/subscription-page"
                className="text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors inline-flex items-center gap-1"
              >
                View subscriptions <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="p-5 bg-slate-50 rounded-xl border-l-4 border-l-mojitax-navy text-sm text-slate-500 leading-relaxed">
            MojiTax Tools is not available separately. It is integrated into Professional Practice courses as the hands-on practice component.
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SECTION 5: CTA
          ══════════════════════════════════════ */}
      <section className="relative py-16 md:py-20 bg-gradient-to-br from-mojitax-navy via-mojitax-navy-light to-blue-600 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 items-center">
            <div>
              <h2 className="text-2xl md:text-[28px] font-bold text-white mb-3">
                Build Practice-Ready Skills
              </h2>
              <p className="text-[15px] text-white/80 leading-relaxed max-w-xl">
                Enrol in a Professional Practice course to access MojiTax Tools, or subscribe for full access to all courses and tools.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <Link
                href="https://www.mojitax.co.uk/courses-catalogue"
                className="inline-flex items-center justify-center gap-2 bg-white text-mojitax-navy font-bold text-base px-8 py-3.5 rounded-full hover:bg-blue-50 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
              >
                <GraduationCap className="w-5 h-5" />
                Browse Courses
              </Link>
              <Link
                href="https://www.mojitax.co.uk/pricing"
                className="inline-flex items-center justify-center gap-2 bg-white/15 text-white border-2 border-white/30 font-bold text-base px-8 py-3.5 rounded-full backdrop-blur-sm hover:bg-white/25 hover:-translate-y-0.5 transition-all duration-300"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
          ══════════════════════════════════════ */}
      <footer className="py-8 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Logo size="sm" />
              <span className="text-sm text-slate-500">
                &copy; {new Date().getFullYear()} MojiTax. All rights reserved.
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <Link href="https://mojitax.co.uk/privacy" className="hover:text-mojitax-navy transition-colors">Privacy</Link>
              <Link href="https://mojitax.co.uk/terms" className="hover:text-mojitax-navy transition-colors">Terms</Link>
              <Link href="https://mojitax.co.uk/contact" className="hover:text-mojitax-navy transition-colors">Contact</Link>
            </div>
          </div>

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
