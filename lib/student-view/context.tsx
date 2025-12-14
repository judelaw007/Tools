'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { StudentViewMode, StudentViewState, Course } from './types';

interface StudentViewContextType extends StudentViewState {
  setViewMode: (mode: StudentViewMode, courseId?: string, courseName?: string) => Promise<void>;
  exitStudentView: () => Promise<void>;
  isInStudentView: boolean;
  isLoading: boolean;
  availableCourses: Course[];
  loadCourses: () => Promise<void>;
}

const StudentViewContext = createContext<StudentViewContextType | undefined>(undefined);

const STORAGE_KEY = 'mojitax-student-view';

export function StudentViewProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StudentViewState>({ mode: 'admin' });
  const [isLoading, setIsLoading] = useState(false);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);

  // Load saved state on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(parsed);
        // Also sync to server
        syncToServer(parsed);
      } catch {
        // Invalid stored state
      }
    }
  }, []);

  // Sync state to server via API
  const syncToServer = async (newState: StudentViewState) => {
    try {
      await fetch('/api/admin/student-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newState),
      });
    } catch (error) {
      console.error('Failed to sync student view state:', error);
    }
  };

  const setViewMode = useCallback(async (
    mode: StudentViewMode,
    courseId?: string,
    courseName?: string
  ) => {
    setIsLoading(true);
    const newState: StudentViewState = {
      mode,
      selectedCourseId: mode === 'with-course' ? courseId : undefined,
      selectedCourseName: mode === 'with-course' ? courseName : undefined,
    };

    try {
      await syncToServer(newState);
      setState(newState);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      // Reload page to apply new view mode
      window.location.reload();
    } catch (error) {
      console.error('Failed to set view mode:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const exitStudentView = useCallback(async () => {
    setIsLoading(true);
    const newState: StudentViewState = { mode: 'admin' };

    try {
      await syncToServer(newState);
      setState(newState);
      localStorage.removeItem(STORAGE_KEY);
      // Reload page to apply normal admin view
      window.location.reload();
    } catch (error) {
      console.error('Failed to exit student view:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCourses = useCallback(async () => {
    if (availableCourses.length > 0) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/courses/list');
      const data = await response.json();
      if (data.success && data.courses) {
        setAvailableCourses(data.courses);
      }
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [availableCourses.length]);

  const value: StudentViewContextType = {
    ...state,
    setViewMode,
    exitStudentView,
    isInStudentView: state.mode !== 'admin',
    isLoading,
    availableCourses,
    loadCourses,
  };

  return (
    <StudentViewContext.Provider value={value}>
      {children}
    </StudentViewContext.Provider>
  );
}

export function useStudentView() {
  const context = useContext(StudentViewContext);
  if (context === undefined) {
    throw new Error('useStudentView must be used within a StudentViewProvider');
  }
  return context;
}
