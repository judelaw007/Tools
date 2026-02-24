'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

/** Maps known path segments to human-readable labels. */
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  admin: 'Admin',
  tools: 'Tools',
  courses: 'Courses',
  skills: 'Skills Matrix',
  activity: 'Activity',
  course: 'Course',
};

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  // Don't render breadcrumb on root pages (single segment)
  if (segments.length <= 1) return null;

  // Build crumb list from segments
  const crumbs = segments.map((seg, idx) => {
    const href = '/' + segments.slice(0, idx + 1).join('/');
    const label = SEGMENT_LABELS[seg] || decodeURIComponent(seg).replace(/[-_]/g, ' ');
    const isLast = idx === segments.length - 1;
    return { href, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-slate-500">
      <Link
        href={segments[0] === 'admin' ? '/admin' : '/dashboard'}
        className="hover:text-mojitax-navy transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="w-3 h-3 text-slate-300" />
          {crumb.isLast ? (
            <span className="text-mojitax-navy font-medium capitalize">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-mojitax-navy transition-colors capitalize">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
