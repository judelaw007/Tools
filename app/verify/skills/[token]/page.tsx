'use client';

/**
 * Public Skill Verification Page
 *
 * Displays verified skills portfolio for a given token.
 * This is a public page - no authentication required.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import {
  CheckCircle2,
  Award,
  BookOpen,
  Wrench,
  Calendar,
  Shield,
  Eye,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { SkillSnapshot } from '@/lib/skill-verifications';

interface VerificationData {
  userName: string;
  skillsSnapshot: SkillSnapshot;
  createdAt: string;
  viewCount: number;
}

export default function VerifySkillsPage() {
  const params = useParams();
  const token = params.token as string;
  const [verification, setVerification] = useState<VerificationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVerification() {
      try {
        const response = await fetch(`/api/verify/skills/${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Verification not found');
          return;
        }

        setVerification(data.verification);
      } catch (err) {
        console.error('Error fetching verification:', err);
        setError('Failed to load verification');
      } finally {
        setIsLoading(false);
      }
    }

    if (token) {
      fetchVerification();
    }
  }, [token]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-mojitax-green animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Verification Not Found</h1>
          <p className="text-slate-600 mb-6">
            This verification link may have expired or is invalid.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-2 bg-mojitax-green text-white rounded-lg hover:bg-mojitax-green/90 transition-colors"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }

  if (!verification) return null;

  const totalCourses = verification.skillsSnapshot.categories.reduce(
    (sum, cat) => sum + cat.courses.length,
    0
  );
  const totalTools = verification.skillsSnapshot.categories.reduce(
    (sum, cat) => sum + cat.tools.length,
    0
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/mojitax-logo.png"
              alt="MojiTax Logo"
              width={40}
              height={40}
              className="object-contain"
            />
            <div className="flex flex-col leading-none">
              <span className="font-bold text-mojitax-navy tracking-tight text-xl">
                Moji<span className="text-mojitax-blue">Tax</span>
              </span>
              <span className="text-mojitax-blue-light font-medium tracking-wider uppercase text-[10px]">
                SKILLS VERIFICATION
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
            <Shield className="w-4 h-4" />
            <span className="font-medium">Verified</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Verification Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          {/* Green Banner */}
          <div className="bg-gradient-to-r from-mojitax-green to-mojitax-green/80 text-white p-6">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-8 h-8" />
              <h1 className="text-2xl font-bold">Skills Portfolio</h1>
            </div>
            <p className="text-white/90 text-lg">{verification.userName}</p>
          </div>

          {/* Meta Info */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-4 h-4" />
              <span>Generated: {formatDate(verification.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <BookOpen className="w-4 h-4 text-purple-500" />
              <span>{totalCourses} courses completed</span>
            </div>
            {totalTools > 0 && (
              <div className="flex items-center gap-2 text-slate-600">
                <Wrench className="w-4 h-4 text-blue-500" />
                <span>{totalTools} tools used</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-500">
              <Eye className="w-4 h-4" />
              <span>Viewed {verification.viewCount} times</span>
            </div>
          </div>

          {/* Skills Content */}
          <div className="p-6 space-y-6">
            {verification.skillsSnapshot.categories.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p>No skills recorded at time of verification.</p>
              </div>
            ) : (
              verification.skillsSnapshot.categories.map((category) => (
                <div
                  key={category.id}
                  className="border border-slate-200 rounded-xl overflow-hidden"
                >
                  {/* Category Header */}
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                    <h2 className="font-semibold text-mojitax-navy text-lg">
                      {category.name}
                    </h2>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Courses */}
                    {category.courses.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-purple-700">
                          <BookOpen className="w-4 h-4" />
                          <span>Knowledge</span>
                        </div>
                        {category.courses.map((course) => (
                          <div
                            key={course.courseId}
                            className="pl-6 py-2 border-l-2 border-purple-200"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                              <span className="font-medium text-slate-800">
                                {course.courseName}
                              </span>
                              <span className="text-sm text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                                {course.progressScore}%
                              </span>
                            </div>
                            {course.knowledgeDescription && (
                              <p className="text-sm text-slate-600 ml-6">
                                {course.knowledgeDescription}
                              </p>
                            )}
                            <p className="text-xs text-slate-400 ml-6 mt-1">
                              Completed: {formatDate(course.completedAt)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tools */}
                    {category.tools.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                          <Wrench className="w-4 h-4" />
                          <span>Application</span>
                        </div>
                        {category.tools.map((tool) => (
                          <div
                            key={tool.toolId}
                            className="pl-6 py-2 border-l-2 border-blue-200"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-slate-800">
                                {tool.toolName}
                              </span>
                              <span className="text-sm text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                                {tool.projectCount} project{tool.projectCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                            {tool.applicationDescription && (
                              <p className="text-sm text-slate-600">
                                {tool.applicationDescription}
                              </p>
                            )}
                            <p className="text-xs text-slate-400 mt-1">
                              Last used: {formatDate(tool.lastUsedAt)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Caveat */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <p className="font-medium mb-1">About this verification</p>
          <p>
            This Skills Portfolio reflects courses completed and tools used on the MojiTax
            learning platform. Competency is demonstrated through practical application
            within the platform&apos;s demo tools. This document was generated for informational
            purposes and represents achievements as of the date shown above.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-slate-500">
          <p>Verified by MojiTax Demo Tools Platform</p>
          <p className="mt-1">
            <a href="https://www.mojitax.co.uk" className="text-mojitax-green hover:underline">
              www.mojitax.co.uk
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
