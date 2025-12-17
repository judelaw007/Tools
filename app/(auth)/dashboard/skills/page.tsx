import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SkillsMatrixV2 } from '@/components/dashboard/SkillsMatrixV2';
import { getServerSession } from '@/lib/server-session';
import { TrendingUp } from 'lucide-react';

export default async function SkillsPage() {
  // Redirect to login if not authenticated
  const session = await getServerSession();
  if (!session) {
    redirect('/auth?returnTo=/dashboard/skills');
  }

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-mojitax-green/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-mojitax-green" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-mojitax-navy">
            Skills Matrix
          </h1>
        </div>
        <p className="text-slate-600">
          Track your professional skills as you progress through courses and use tools.
        </p>
      </div>

      {/* Skills Matrix Component */}
      <SkillsMatrixV2 />
    </DashboardLayout>
  );
}
