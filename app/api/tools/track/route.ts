import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { logToolUsage } from '@/lib/db';
import { incrementToolUsage } from '@/lib/skills';
import { incrementToolProjectCount } from '@/lib/skill-categories';
import { logActivity } from '@/lib/activity-logs';

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { toolId, action, sessionId, metadata } = body;

    if (!toolId || !action) {
      return NextResponse.json(
        { error: 'toolId and action are required' },
        { status: 400 }
      );
    }

    const validActions = ['view', 'calculate', 'save', 'export', 'error'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Log to tool_usage_logs (fire-and-forget)
    logToolUsage(
      toolId,
      action,
      session.email,
      session.learnworldsId,
      metadata,
      sessionId
    ).catch(() => {});

    // On calculate events, increment tool usage for skills
    if (action === 'calculate') {
      const toolName = metadata?.toolName as string || toolId;
      const toolCategory = metadata?.toolCategory as string || 'cross_category';

      incrementToolUsage(
        session.email,
        toolId,
        toolName,
        toolCategory
      ).catch(() => {});

      // Log activity for dashboard visibility
      logActivity({
        type: 'tool_usage',
        userEmail: session.email,
        description: `Used ${toolName}: ${metadata?.stepName || metadata?.event || 'calculation'}`,
        metadata: { toolId, action, sessionId, ...metadata },
      }).catch(() => {});

      // On workflow completion, also increment project count
      if (metadata?.event === 'workflow_complete') {
        incrementToolProjectCount(session.email, toolId).catch(() => {});
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error tracking tool usage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
