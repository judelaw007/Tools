'use client';

/**
 * Printable Skills Matrix Component
 *
 * A print-optimized version of the Skills Matrix that includes:
 * - MojiTax branding and logo
 * - User's name
 * - Selected skills with courses and tools
 * - QR code for verification
 * - Caveat/disclaimer text
 *
 * Adaptive Layout:
 * - 1 skill: Full page, expanded view
 * - 2 skills: 2-column split
 * - 3-4 skills: 2x2 grid
 * - 5+ skills: Compact cards with auto page breaks
 */

import { forwardRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { SkillSnapshot } from '@/lib/skill-verifications';

// Dynamically import QRCodeSVG to avoid SSR issues
const QRCodeSVG = dynamic(
  () => import('qrcode.react').then((mod) => mod.QRCodeSVG),
  { ssr: false, loading: () => <div className="w-[100px] h-[100px] bg-gray-100 animate-pulse" /> }
);

// Layout modes for adaptive print layout
type LayoutMode = 'full' | 'half' | 'compact';

interface CategoryContent {
  id: string;
  coursesCount: number;
  toolsCount: number;
  hasDescriptions: boolean;
}

/**
 * Analyze content to estimate how much space each category needs
 */
function analyzeContent(snapshot: SkillSnapshot): CategoryContent[] {
  return snapshot.categories.map((cat) => ({
    id: cat.id,
    coursesCount: cat.courses.length,
    toolsCount: cat.tools.length,
    hasDescriptions: cat.courses.some((c) => c.knowledgeDescription) ||
      cat.tools.some((t) => t.applicationDescription),
  }));
}

/**
 * Determine the best layout mode based on content
 */
function getLayoutMode(snapshot: SkillSnapshot): LayoutMode {
  const categoryCount = snapshot.categories.length;

  if (categoryCount === 0 || categoryCount === 1) {
    return 'full';
  }

  // Calculate total content items
  const totalItems = snapshot.categories.reduce(
    (sum, cat) => sum + cat.courses.length + cat.tools.length,
    0
  );

  // Check if categories have long descriptions
  const hasLongDescriptions = snapshot.categories.some((cat) =>
    cat.courses.some((c) => c.knowledgeDescription && c.knowledgeDescription.length > 100) ||
    cat.tools.some((t) => t.applicationDescription && t.applicationDescription.length > 100)
  );

  // 2 categories with moderate content -> half layout
  if (categoryCount === 2 && totalItems <= 8 && !hasLongDescriptions) {
    return 'half';
  }

  // 3-4 categories with light content -> half layout (2x2 grid)
  if (categoryCount <= 4 && totalItems <= 12 && !hasLongDescriptions) {
    return 'half';
  }

  // More categories or heavy content -> compact
  return 'compact';
}

/**
 * Get CSS classes for the skills grid based on layout mode
 */
function getGridClasses(mode: LayoutMode): string {
  switch (mode) {
    case 'full':
      return 'space-y-6';
    case 'half':
      return 'grid grid-cols-2 gap-4';
    case 'compact':
      return 'grid grid-cols-2 gap-3';
  }
}

/**
 * Get CSS classes for individual skill cards based on layout mode
 */
function getCardClasses(mode: LayoutMode): string {
  const base = 'border border-gray-300 rounded-lg overflow-hidden';
  switch (mode) {
    case 'full':
      return base;
    case 'half':
      return `${base} break-inside-avoid`;
    case 'compact':
      return `${base} break-inside-avoid text-sm`;
  }
}

/**
 * Calculate learning hours by year from snapshot
 */
function calculateLearningHoursByYear(snapshot: SkillSnapshot): Map<number, number> {
  const hoursByYear = new Map<number, number>();

  for (const category of snapshot.categories) {
    for (const course of category.courses) {
      if (course.learningHours && course.learningHours > 0) {
        const year = new Date(course.completedAt).getFullYear();
        const current = hoursByYear.get(year) || 0;
        hoursByYear.set(year, current + course.learningHours);
      }
    }
  }

  return hoursByYear;
}

interface PrintableSkillsMatrixProps {
  userName: string;
  snapshot: SkillSnapshot;
  verificationUrl: string;
  generatedAt: string;
}

export const PrintableSkillsMatrix = forwardRef<HTMLDivElement, PrintableSkillsMatrixProps>(
  function PrintableSkillsMatrix({ userName, snapshot, verificationUrl, generatedAt }, ref) {
    // Determine layout mode based on content
    const layoutMode = useMemo(() => getLayoutMode(snapshot), [snapshot]);

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    };

    const totalCourses = snapshot.categories.reduce(
      (sum, cat) => sum + cat.courses.length,
      0
    );
    const totalTools = snapshot.categories.reduce(
      (sum, cat) => sum + cat.tools.length,
      0
    );

    // Calculate learning hours by year
    const hoursByYear = useMemo(() => calculateLearningHoursByYear(snapshot), [snapshot]);
    const currentYear = new Date(generatedAt).getFullYear();
    const currentYearHours = hoursByYear.get(currentYear) || 0;
    const totalLearningHours = Array.from(hoursByYear.values()).reduce((sum, h) => sum + h, 0);

    // Dynamic sizes based on layout mode
    const isCompact = layoutMode === 'compact';
    const isHalf = layoutMode === 'half';
    const headerPadding = isCompact ? 'px-3 py-2' : 'px-4 py-3';
    const contentPadding = isCompact ? 'p-3' : 'p-4';
    const sectionSpacing = isCompact ? 'mb-3' : 'mb-4';
    const itemSpacing = isCompact ? 'space-y-2' : 'space-y-3';
    const titleSize = isCompact ? 'text-base' : 'text-lg';
    const descriptionSize = isCompact ? 'text-xs' : 'text-sm';

    return (
      <div ref={ref} className="print-container bg-white">
        {/* Print Styles */}
        <style jsx global>{`
          @media print {
            @page {
              size: A4;
              margin: 12mm;
            }
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print {
              display: none !important;
            }
            .print-container {
              width: 100%;
              max-width: none;
              padding: 0;
              margin: 0;
            }
            .page-break {
              page-break-before: always;
            }
            /* Prevent breaking inside skill cards */
            .skill-card {
              break-inside: avoid;
              page-break-inside: avoid;
            }
            /* Grid layout for multi-column */
            .skills-grid-half {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
            }
            .skills-grid-compact {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10px;
            }
            /* Ensure footer stays at bottom or on new page */
            .print-footer {
              break-inside: avoid;
              page-break-inside: avoid;
            }
          }
          @media screen {
            .print-container {
              max-width: 210mm;
              margin: 0 auto;
              padding: 20px;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
          }
        `}</style>

        {/* Header with Logo */}
        <header className={`flex items-start justify-between ${isCompact ? 'mb-4 pb-3' : 'mb-8 pb-4'} border-b-2 border-[#00A651]`}>
          <div className="flex items-center gap-4">
            {/* Logo - Using inline SVG for print compatibility */}
            <div className="flex items-center gap-2">
              <img
                src="/mojitax-logo.png"
                alt="MojiTax"
                className={`${isCompact ? 'w-10 h-10' : 'w-12 h-12'} object-contain`}
              />
              <div className="flex flex-col leading-none">
                <span className={`font-bold text-[#0B1F3A] tracking-tight ${isCompact ? 'text-xl' : 'text-2xl'}`}>
                  Moji<span className="text-[#2E5BA8]">Tax</span>
                </span>
                <span className={`text-[#4A90D9] font-medium tracking-wider uppercase ${isCompact ? 'text-[8px]' : 'text-[10px]'}`}>
                  SKILLS PORTFOLIO
                </span>
              </div>
            </div>
          </div>
          <div className={`text-right ${isCompact ? 'text-xs' : 'text-sm'} text-gray-600`}>
            <p>Generated: {formatDate(generatedAt)}</p>
          </div>
        </header>

        {/* User Info */}
        <section className={isCompact ? 'mb-4' : 'mb-8'}>
          <h1 className={`font-bold text-[#0B1F3A] mb-2 ${isCompact ? 'text-2xl' : 'text-3xl'}`}>{userName}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span>{totalCourses} course{totalCourses !== 1 ? 's' : ''} completed</span>
            {totalTools > 0 && (
              <span>{totalTools} tool{totalTools !== 1 ? 's' : ''} used</span>
            )}
            {snapshot.categories.length > 1 && (
              <span className="text-gray-400">({snapshot.categories.length} skill areas)</span>
            )}
          </div>

          {/* Learning Hours Summary */}
          {totalLearningHours > 0 && (
            <div className={`mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg ${isCompact ? 'text-xs' : 'text-sm'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-amber-900">Learning Hours</span>
                  <span className="text-amber-700">({currentYear})</span>
                </div>
                <span className="font-bold text-amber-900 text-lg">{currentYearHours} hrs</span>
              </div>
              {hoursByYear.size > 1 && (
                <div className="mt-2 pt-2 border-t border-amber-200 flex flex-wrap gap-2">
                  {Array.from(hoursByYear.entries())
                    .sort((a, b) => b[0] - a[0])
                    .map(([year, hours]) => (
                      <span
                        key={year}
                        className={`px-2 py-0.5 rounded-full ${
                          year === currentYear
                            ? 'bg-amber-200 text-amber-900 font-medium'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {year}: {hours} hrs
                      </span>
                    ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Skills Content */}
        <section className={isCompact ? 'mb-4' : 'mb-8'}>
          {snapshot.categories.length === 0 ? (
            <div className="py-12 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-lg mb-2">Skills Portfolio</p>
              <p className="text-sm">
                Complete courses and use tools to build your professional portfolio.
              </p>
            </div>
          ) : (
            <div className={
              layoutMode === 'full' ? 'space-y-6' :
              layoutMode === 'half' ? 'skills-grid-half grid grid-cols-2 gap-4' :
              'skills-grid-compact grid grid-cols-2 gap-3'
            }>
              {snapshot.categories.map((category) => (
                <div
                  key={category.id}
                  className={`skill-card border border-gray-300 rounded-lg overflow-hidden ${
                    isCompact ? 'text-sm' : ''
                  }`}
                >
                  {/* Category Header */}
                  <div className={`bg-[#00A651] bg-opacity-10 ${headerPadding} border-b border-gray-300`}>
                    <h2 className={`font-bold text-[#0B1F3A] ${titleSize}`}>{category.name}</h2>
                  </div>

                  <div className={contentPadding}>
                    {/* Knowledge Section - Courses */}
                    {category.courses.length > 0 && (
                      <div className={sectionSpacing}>
                        <h3 className={`${isCompact ? 'text-xs' : 'text-sm'} font-semibold text-purple-700 ${isCompact ? 'mb-2' : 'mb-3'} flex items-center gap-2`}>
                          <span className={`${isCompact ? 'w-4 h-4 text-[10px]' : 'w-5 h-5 text-xs'} rounded bg-purple-100 flex items-center justify-center`}>K</span>
                          Knowledge
                        </h3>
                        <div className={`${itemSpacing} ${isCompact ? 'pl-5' : 'pl-7'}`}>
                          {category.courses.map((course) => (
                            <div key={course.courseId} className={`border-l-2 border-purple-200 ${isCompact ? 'pl-2 py-0.5' : 'pl-3 py-1'}`}>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-medium text-gray-800 ${isCompact ? 'text-xs' : ''}`}>{course.courseName}</span>
                                {course.learningHours && course.learningHours > 0 && (
                                  <span className={`${isCompact ? 'text-[10px]' : 'text-xs'} bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full`}>
                                    {course.learningHours} hrs
                                  </span>
                                )}
                                <span className={`${isCompact ? 'text-[10px]' : 'text-xs'} bg-green-100 text-green-700 px-2 py-0.5 rounded-full`}>
                                  {course.progressScore > 0 ? `Score: ${course.progressScore}%` : 'Completed'}
                                </span>
                              </div>
                              {course.knowledgeDescription && (
                                <p className={`${descriptionSize} text-gray-600 mt-1 ${isCompact ? 'line-clamp-2' : ''}`}>{course.knowledgeDescription}</p>
                              )}
                              <p className={`${isCompact ? 'text-[10px]' : 'text-xs'} text-gray-400 mt-1`}>
                                Completed: {formatDate(course.completedAt)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Application Section - Tools */}
                    {category.tools.length > 0 && (
                      <div>
                        <h3 className={`${isCompact ? 'text-xs' : 'text-sm'} font-semibold text-blue-700 ${isCompact ? 'mb-2' : 'mb-3'} flex items-center gap-2`}>
                          <span className={`${isCompact ? 'w-4 h-4 text-[10px]' : 'w-5 h-5 text-xs'} rounded bg-blue-100 flex items-center justify-center`}>A</span>
                          Application
                        </h3>
                        <div className={`${itemSpacing} ${isCompact ? 'pl-5' : 'pl-7'}`}>
                          {category.tools.map((tool) => (
                            <div key={tool.toolId} className={`border-l-2 border-blue-200 ${isCompact ? 'pl-2 py-0.5' : 'pl-3 py-1'}`}>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-medium text-gray-800 ${isCompact ? 'text-xs' : ''}`}>{tool.toolName}</span>
                                <span className={`${isCompact ? 'text-[10px]' : 'text-xs'} bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full`}>
                                  {tool.projectCount} project{tool.projectCount !== 1 ? 's' : ''}
                                </span>
                              </div>
                              {tool.applicationDescription && (
                                <p className={`${descriptionSize} text-gray-600 mt-1 ${isCompact ? 'line-clamp-2' : ''}`}>{tool.applicationDescription}</p>
                              )}
                              <p className={`${isCompact ? 'text-[10px]' : 'text-xs'} text-gray-400 mt-1`}>
                                Last used: {formatDate(tool.lastUsedAt)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer with QR and Caveat */}
        <footer className={`print-footer border-t-2 border-gray-200 ${isCompact ? 'pt-4 mt-4' : 'pt-6 mt-8'}`}>
          <div className={`flex ${isCompact ? 'gap-4' : 'gap-6'}`}>
            {/* QR Code */}
            <div className="flex-shrink-0">
              <div className="p-2 bg-white border border-gray-300 rounded-lg">
                <QRCodeSVG
                  value={verificationUrl}
                  size={isCompact ? 80 : 100}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">Scan to verify</p>
            </div>

            {/* Caveat Text */}
            <div className="flex-1">
              <h4 className={`${isCompact ? 'text-xs' : 'text-sm'} font-semibold text-gray-700 mb-2`}>About this Portfolio</h4>
              <p className={`${isCompact ? 'text-[10px]' : 'text-xs'} text-gray-600 leading-relaxed`}>
                This Skills Portfolio, generated on the MojiTax Platform, provides an evidence-based
                benchmark of the individual&apos;s knowledge and practical application of relevant skills.
                Competency is demonstrated through course completion, engagement with platform demo
                tools, and the achievement of key learning milestones. You can verify the authenticity
                by scanning the QR code or visiting:
              </p>
              <p className={`${isCompact ? 'text-[10px]' : 'text-xs'} text-[#00A651] mt-2 break-all`}>{verificationUrl}</p>
            </div>
          </div>

          {/* MojiTax Footer */}
          <div className={`${isCompact ? 'mt-4 pt-3' : 'mt-6 pt-4'} border-t border-gray-200 text-center`}>
            <p className={`${isCompact ? 'text-[10px]' : 'text-xs'} text-gray-500`}>
              MojiTax Limited is a registered company in the United Kingdom
            </p>
            <p className={`${isCompact ? 'text-[10px]' : 'text-xs'} text-gray-500 mt-1`}>
              Company No. 13857853 &bull; www.mojitax.co.uk
            </p>
          </div>
        </footer>
      </div>
    );
  }
);
