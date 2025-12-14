import { NextRequest, NextResponse } from 'next/server';
import { getToolBySlug, getAllTools } from '@/lib/db';
import { createServiceClient } from '@/lib/supabase/server';
import { SEED_TOOLS } from '@/lib/db/seed-data';

/**
 * GET /api/debug/tool-allocations?slug=globe-calculator
 *
 * Debug endpoint to investigate why tool pages show "No courses"
 * while dashboard shows courses with tools allocated.
 *
 * Shows:
 * - Tool info from both seed data and Supabase
 * - All allocations in the database
 * - Whether the tool ID matches any allocations
 * - Recommendations for fixing mismatches
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug') || 'globe-calculator';

    // Get tool by slug
    const tool = await getToolBySlug(slug);

    // Get all tools to see ID format
    const allTools = await getAllTools();
    const toolIds = allTools.map(t => ({ id: t.id, slug: t.slug, name: t.name }));

    // Get seed tool for comparison
    const seedTool = SEED_TOOLS.find(t => t.slug === slug);

    // Query allocations directly from Supabase
    const supabase = createServiceClient();

    // Get all allocations
    const { data: allocations, error: allocError } = await supabase
      .from('course_tool_allocations')
      .select('*');

    // Get tools from Supabase directly (to compare with seed data)
    const { data: dbTools, error: dbToolsError } = await supabase
      .from('tools')
      .select('id, slug, name')
      .limit(10);

    // Get allocations matching the tool ID (if tool exists)
    let matchingAllocations = null;
    if (tool) {
      const { data: matches, error: matchError } = await supabase
        .from('course_tool_allocations')
        .select('*')
        .eq('tool_id', tool.id);

      matchingAllocations = {
        searchedToolId: tool.id,
        results: matches,
        error: matchError?.message,
      };
    }

    // Get unique tool IDs in allocations
    const allocatedToolIds = [...new Set((allocations || []).map((a: { tool_id: string }) => a.tool_id))];

    // Check if any tool IDs in allocations match tools table
    const matchingTools = toolIds.filter(t => allocatedToolIds.includes(t.id));
    const orphanedAllocations = allocatedToolIds.filter(id => !toolIds.find(t => t.id === id));

    // Build recommendations
    const recommendations: string[] = [];

    // Check if tool IDs match
    if (tool && !allocatedToolIds.includes(tool.id)) {
      recommendations.push(`Tool '${tool.slug}' has ID '${tool.id}' but this ID is not in any allocations.`);
    }

    // Check for orphaned allocations
    if (orphanedAllocations.length > 0) {
      recommendations.push(`Found ${orphanedAllocations.length} tool IDs in allocations that don't exist in tools table: ${orphanedAllocations.join(', ')}`);
    }

    // Check if database is empty
    if (!dbTools || dbTools.length === 0) {
      recommendations.push('The "tools" table in Supabase is EMPTY. Tools are being loaded from seed data. You need to populate the tools table with the seed data.');
    }

    // Check for ID format mismatch
    if (dbTools && dbTools.length > 0 && seedTool) {
      const dbTool = dbTools.find((t: { slug: string }) => t.slug === slug);
      if (dbTool && (dbTool as { id: string }).id !== seedTool.id) {
        recommendations.push(`ID mismatch: DB tool has ID '${(dbTool as { id: string }).id}' but seed tool has ID '${seedTool.id}'`);
      }
    }

    // Check if allocations use seed IDs but tools table has different IDs
    if (allocatedToolIds.length > 0 && dbTools && dbTools.length > 0) {
      const dbToolIds = dbTools.map((t: { id: string }) => t.id);
      const seedToolIds = SEED_TOOLS.map(t => t.id);
      const allocationsUseSeedIds = allocatedToolIds.some((id: string) => seedToolIds.includes(id) && !dbToolIds.includes(id));

      if (allocationsUseSeedIds) {
        recommendations.push('Allocations appear to use seed tool IDs, but the tools table has different IDs. This is likely the cause of the mismatch.');
      }
    }

    if (recommendations.length === 0 && tool && allocatedToolIds.includes(tool.id)) {
      recommendations.push('No issues detected. Tool ID matches allocations correctly.');
    }

    return NextResponse.json({
      debug: {
        slug,
        timestamp: new Date().toISOString(),
      },
      tool: tool ? {
        id: tool.id,
        slug: tool.slug,
        name: tool.name,
        status: tool.status,
      } : null,
      seedTool: seedTool ? {
        id: seedTool.id,
        slug: seedTool.slug,
        name: seedTool.name,
      } : null,
      supabaseTools: {
        count: dbTools?.length || 0,
        samples: dbTools?.slice(0, 5),
        error: dbToolsError?.message,
      },
      allToolsFromCode: {
        count: allTools.length,
        samples: toolIds.slice(0, 5),
        source: dbTools && dbTools.length > 0 ? 'supabase' : 'seed_data',
      },
      allocations: {
        total: allocations?.length || 0,
        error: allocError?.message,
        samples: allocations?.slice(0, 5),
        uniqueToolIds: allocatedToolIds,
        uniqueCourseIds: [...new Set((allocations || []).map((a: { course_id: string }) => a.course_id))],
      },
      matchingAllocations,
      analysis: {
        toolsWithAllocations: matchingTools,
        orphanedToolIds: orphanedAllocations,
        toolIdMatchesAllocations: tool ? allocatedToolIds.includes(tool.id) : false,
        possibleIdMismatch: orphanedAllocations.length > 0 || (tool && !allocatedToolIds.includes(tool.id)),
      },
      recommendations,
    });
  } catch (error) {
    console.error('Debug tool allocations error:', error);
    return NextResponse.json(
      { error: 'Failed to get debug info', details: String(error) },
      { status: 500 }
    );
  }
}
