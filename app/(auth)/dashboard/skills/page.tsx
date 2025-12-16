import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SkillsMatrix } from '@/components/dashboard/SkillsMatrix';
import { getServerSession } from '@/lib/server-session';
import { TrendingUp } from 'lucide-react';

export default async function SkillsPage() {
  const session = await getServerSession();

  // Get username for greeting
  const username = session?.learnworldsUser?.username ||
                   session?.email?.split('@')[0] ||
                   'there';

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
          Skills are automatically detected from your platform activity.
        </p>
      </div>

      {/* Skills Matrix Component */}
      <SkillsMatrix />
    </DashboardLayout>
  );
}
