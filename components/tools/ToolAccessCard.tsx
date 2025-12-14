'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AuthModal } from '@/components/auth/AuthModal';
import { Lock, GraduationCap, ArrowRight } from 'lucide-react';

interface Course {
  id: string;
  name: string;
  slug?: string;
  learnworldsUrl?: string;
}

interface ToolAccessCardProps {
  toolName: string;
  toolSlug: string;
  courses: Course[];
}

export function ToolAccessCard({ toolName, toolSlug, courses }: ToolAccessCardProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <>
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
            <Button
              variant="primary"
              className="w-full"
              onClick={() => setIsAuthModalOpen(true)}
            >
              Log In to Access
            </Button>
          </div>
        </CardContent>
      </Card>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        toolName={toolName}
        returnTo={`/tools/${toolSlug}`}
      />
    </>
  );
}
