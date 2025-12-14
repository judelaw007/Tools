'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useStudentView } from '@/lib/student-view';
import {
  Eye,
  EyeOff,
  ChevronDown,
  User,
  UserX,
  BookOpen,
  Check,
  Loader2,
  X,
} from 'lucide-react';

interface StudentViewSelectorProps {
  className?: string;
}

export function StudentViewSelector({ className }: StudentViewSelectorProps) {
  const {
    mode,
    selectedCourseName,
    setViewMode,
    exitStudentView,
    isInStudentView,
    isLoading,
    availableCourses,
    loadCourses,
  } = useStudentView();

  const [isOpen, setIsOpen] = useState(false);
  const [showCourseSelect, setShowCourseSelect] = useState(false);

  // Load courses when dropdown opens
  useEffect(() => {
    if (isOpen && availableCourses.length === 0) {
      loadCourses();
    }
  }, [isOpen, availableCourses.length, loadCourses]);

  const handleModeSelect = (newMode: 'no-account' | 'no-courses' | 'with-course') => {
    if (newMode === 'with-course') {
      setShowCourseSelect(true);
    } else {
      setViewMode(newMode);
      setIsOpen(false);
    }
  };

  const handleCourseSelect = (courseId: string, courseName: string) => {
    setViewMode('with-course', courseId, courseName);
    setShowCourseSelect(false);
    setIsOpen(false);
  };

  const handleExit = () => {
    exitStudentView();
    setIsOpen(false);
    setShowCourseSelect(false);
  };

  // If in student view, show a prominent banner
  if (isInStudentView) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg text-sm font-medium">
          <Eye className="w-4 h-4" />
          <span>
            Student View:{' '}
            {mode === 'no-account' && 'No Account'}
            {mode === 'no-courses' && 'No Courses'}
            {mode === 'with-course' && selectedCourseName}
          </span>
          <button
            onClick={handleExit}
            disabled={isLoading}
            className="ml-1 p-0.5 hover:bg-amber-200 rounded transition-colors"
            title="Exit Student View"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <X className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-mojitax-navy hover:bg-slate-100 rounded-lg transition-colors"
      >
        <EyeOff className="w-4 h-4" />
        <span className="hidden md:inline">Student View</span>
        <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false);
              setShowCourseSelect(false);
            }}
          />
          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50">
            {!showCourseSelect ? (
              <>
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-sm font-medium text-mojitax-navy">Preview as Student</p>
                  <p className="text-xs text-slate-500">See what different users see</p>
                </div>

                {/* No Account Option */}
                <button
                  onClick={() => handleModeSelect('no-account')}
                  disabled={isLoading}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <UserX className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">No MojiTax Account</p>
                    <p className="text-xs text-slate-500">Visitor without an account</p>
                  </div>
                </button>

                {/* Account with No Courses */}
                <button
                  onClick={() => handleModeSelect('no-courses')}
                  disabled={isLoading}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">MojiTax Account</p>
                    <p className="text-xs text-slate-500">User with no course enrollments</p>
                  </div>
                </button>

                {/* Account with Specific Course */}
                <button
                  onClick={() => handleModeSelect('with-course')}
                  disabled={isLoading}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors border-t border-slate-100"
                >
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">MojiTax Account + Course</p>
                    <p className="text-xs text-slate-500">User enrolled in a specific course</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 -rotate-90" />
                </button>
              </>
            ) : (
              <>
                {/* Course Selection */}
                <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => setShowCourseSelect(false)}
                    className="p-1 hover:bg-slate-100 rounded"
                  >
                    <ChevronDown className="w-4 h-4 text-slate-500 rotate-90" />
                  </button>
                  <p className="text-sm font-medium text-mojitax-navy">Select Course</p>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                  </div>
                ) : availableCourses.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-slate-500">
                    No courses available.
                    <br />
                    <span className="text-xs">Configure LearnWorlds first.</span>
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto">
                    {availableCourses
                      .filter((c) => c.type === 'course')
                      .map((course) => (
                        <button
                          key={course.id}
                          onClick={() => handleCourseSelect(course.id, course.title)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
                        >
                          <BookOpen className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-700 truncate flex-1">
                            {course.title}
                          </span>
                        </button>
                      ))}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
