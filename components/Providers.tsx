'use client';

import { AuthProvider } from '@/lib/auth';
import { StudentViewProvider } from '@/lib/student-view';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <StudentViewProvider>{children}</StudentViewProvider>
    </AuthProvider>
  );
}
