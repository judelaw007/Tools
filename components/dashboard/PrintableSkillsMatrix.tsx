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
 */

import { forwardRef } from 'react';
import dynamic from 'next/dynamic';
import { SkillSnapshot } from '@/lib/skill-verifications';

// Dynamically import QRCodeSVG to avoid SSR issues
const QRCodeSVG = dynamic(
  () => import('qrcode.react').then((mod) => mod.QRCodeSVG),
  { ssr: false, loading: () => <div className="w-[100px] h-[100px] bg-gray-100 animate-pulse" /> }
);

interface PrintableSkillsMatrixProps {
  userName: string;
  snapshot: SkillSnapshot;
  verificationUrl: string;
  generatedAt: string;
}

export const PrintableSkillsMatrix = forwardRef<HTMLDivElement, PrintableSkillsMatrixProps>(
  function PrintableSkillsMatrix({ userName, snapshot, verificationUrl, generatedAt }, ref) {
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

    return (
      <div ref={ref} className="print-container bg-white">
        {/* Print Styles */}
        <style jsx global>{`
          @media print {
            @page {
              size: A4;
              margin: 15mm;
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
        <header className="flex items-start justify-between mb-8 pb-4 border-b-2 border-[#00A651]">
          <div className="flex items-center gap-4">
            {/* Logo - Using inline SVG for print compatibility */}
            <div className="flex items-center gap-2">
              <img
                src="/mojitax-logo.png"
                alt="MojiTax"
                className="w-12 h-12 object-contain"
              />
              <div className="flex flex-col leading-none">
                <span className="font-bold text-[#0B1F3A] tracking-tight text-2xl">
                  Moji<span className="text-[#2E5BA8]">Tax</span>
                </span>
                <span className="text-[#4A90D9] font-medium tracking-wider uppercase text-[10px]">
                  SKILLS PORTFOLIO
                </span>
              </div>
            </div>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p>Generated: {formatDate(generatedAt)}</p>
          </div>
        </header>

        {/* User Info */}
        <section className="mb-8">
          <h1 className="text-3xl font-bold text-[#0B1F3A] mb-2">{userName}</h1>
          <div className="flex gap-6 text-sm text-gray-600">
            <span>{totalCourses} course{totalCourses !== 1 ? 's' : ''} completed</span>
            {totalTools > 0 && (
              <span>{totalTools} tool{totalTools !== 1 ? 's' : ''} used</span>
            )}
          </div>
        </section>

        {/* Skills Content */}
        <section className="mb-8">
          {snapshot.categories.length === 0 ? (
            <div className="py-12 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-lg mb-2">Skills Portfolio</p>
              <p className="text-sm">
                Complete courses and use tools to build your professional portfolio.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {snapshot.categories.map((category) => (
                <div
                  key={category.id}
                  className="border border-gray-300 rounded-lg overflow-hidden"
                >
                  {/* Category Header */}
                  <div className="bg-[#00A651] bg-opacity-10 px-4 py-3 border-b border-gray-300">
                    <h2 className="font-bold text-[#0B1F3A] text-lg">{category.name}</h2>
                  </div>

                  <div className="p-4">
                    {/* Knowledge Section - Courses */}
                    {category.courses.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold text-purple-700 mb-3 flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-purple-100 flex items-center justify-center text-xs">K</span>
                          Knowledge
                        </h3>
                        <div className="space-y-3 pl-7">
                          {category.courses.map((course) => (
                            <div key={course.courseId} className="border-l-2 border-purple-200 pl-3 py-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-gray-800">{course.courseName}</span>
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                  Score: {course.progressScore}%
                                </span>
                              </div>
                              {course.knowledgeDescription && (
                                <p className="text-sm text-gray-600 mt-1">{course.knowledgeDescription}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
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
                        <h3 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center text-xs">A</span>
                          Application
                        </h3>
                        <div className="space-y-3 pl-7">
                          {category.tools.map((tool) => (
                            <div key={tool.toolId} className="border-l-2 border-blue-200 pl-3 py-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-gray-800">{tool.toolName}</span>
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  {tool.projectCount} project{tool.projectCount !== 1 ? 's' : ''}
                                </span>
                              </div>
                              {tool.applicationDescription && (
                                <p className="text-sm text-gray-600 mt-1">{tool.applicationDescription}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
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
        <footer className="border-t-2 border-gray-200 pt-6 mt-8">
          <div className="flex gap-6">
            {/* QR Code */}
            <div className="flex-shrink-0">
              <div className="p-2 bg-white border border-gray-300 rounded-lg">
                <QRCodeSVG
                  value={verificationUrl}
                  size={100}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">Scan to verify</p>
            </div>

            {/* Caveat Text */}
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">About this Portfolio</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                This Skills Portfolio, generated on the MojiTax Platform, provides an evidence-based
                benchmark of the individual&apos;s knowledge and practical application of relevant skills.
                Competency is demonstrated through course completion, engagement with platform demo
                tools, and the achievement of key learning milestones. You can verify the authenticity
                by scanning the QR code or visiting:
              </p>
              <p className="text-xs text-[#00A651] mt-2 break-all">{verificationUrl}</p>
            </div>
          </div>

          {/* MojiTax Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              MojiTax Limited is a registered company in the United Kingdom
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Company No. 13857853 &bull; www.mojitax.co.uk
            </p>
          </div>
        </footer>
      </div>
    );
  }
);
