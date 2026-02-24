import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardToolsLibrary } from '@/components/dashboard/DashboardToolsLibrary';
import { getCoursesWithTools } from '@/lib/course-allocations';
import { getActiveTools } from '@/lib/db';
import { getServerSession } from '@/lib/server-session';
import type { Tool } from '@/types';

export interface ToolWithAccess {
  tool: Tool;
  hasAccess: boolean;
  courseNames: string[];
}

export default async function DashboardToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect('/auth?returnTo=/dashboard/tools');
  }

  // Fetch data in parallel
  const [coursesWithTools, activeTools] = await Promise.all([
    getCoursesWithTools(),
    getActiveTools(),
  ]);

  // Build a set of user's accessible course IDs
  const userCourseIds = new Set(session?.accessibleCourseIds || []);

  // Build a map: toolId -> { hasAccess, courseNames }
  const toolAccessMap = new Map<string, { hasAccess: boolean; courseNames: string[] }>();

  for (const course of coursesWithTools) {
    const userHasCourse = userCourseIds.has(course.courseId);
    for (const toolId of course.toolIds) {
      const existing = toolAccessMap.get(toolId);
      if (existing) {
        existing.courseNames.push(course.courseName);
        if (userHasCourse) existing.hasAccess = true;
      } else {
        toolAccessMap.set(toolId, {
          hasAccess: userHasCourse,
          courseNames: [course.courseName],
        });
      }
    }
  }

  // Build the tools list: only show tools that have at least one course allocation
  const toolsWithAccess: ToolWithAccess[] = activeTools
    .filter(tool => toolAccessMap.has(tool.id))
    .map(tool => {
      const access = toolAccessMap.get(tool.id)!;
      return {
        tool,
        hasAccess: access.hasAccess,
        courseNames: access.courseNames,
      };
    });

  const { q: initialSearch } = await searchParams;

  return (
    <DashboardLayout>
      <DashboardToolsLibrary tools={toolsWithAccess} initialSearch={initialSearch || ''} />
    </DashboardLayout>
  );
}

export const metadata = {
  title: 'Browse Tools | MojiTax',
  description: 'Browse and access your MojiTax demo tools',
};
