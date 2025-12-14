import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { SEED_TOOLS } from '@/lib/db/seed-data';

/**
 * POST /api/admin/sync-tools
 *
 * Syncs the Supabase tools table with seed data.
 * This ensures tool IDs are consistent between the application and database.
 *
 * Use this when:
 * - The tools table is empty
 * - Tool IDs don't match between allocations and tools table
 * - You need to reset tools to seed data
 */
export async function POST() {
  try {
    const supabase = createServiceClient();

    // Check current tools in database
    const { data: existingTools, error: checkError } = await supabase
      .from('tools')
      .select('id, slug');

    if (checkError) {
      console.error('Error checking existing tools:', checkError);
      return NextResponse.json(
        { success: false, error: 'Failed to check existing tools', details: checkError.message },
        { status: 500 }
      );
    }

    const existingIds = new Set(existingTools?.map(t => t.id) || []);
    const existingSlugs = new Set(existingTools?.map(t => t.slug) || []);

    // Prepare tools for insertion/update
    const toolsToInsert = [];
    const toolsToUpdate = [];

    for (const tool of SEED_TOOLS) {
      const toolData = {
        id: tool.id,
        name: tool.name,
        slug: tool.slug,
        tool_type: tool.toolType,
        category: tool.category,
        icon: tool.icon || null,
        short_description: tool.shortDescription || null,
        description: tool.description || null,
        preview_image: tool.previewImage || null,
        config: tool.config || {},
        status: tool.status,
        is_public: tool.isPublic,
        is_premium: tool.isPremium,
        version: tool.version,
      };

      if (!existingIds.has(tool.id) && !existingSlugs.has(tool.slug)) {
        // New tool - insert
        toolsToInsert.push(toolData);
      } else if (existingIds.has(tool.id)) {
        // Existing tool with same ID - update
        toolsToUpdate.push(toolData);
      } else {
        // Slug exists but with different ID - this is a conflict
        console.warn(`Slug '${tool.slug}' exists with different ID. Skipping.`);
      }
    }

    // Insert new tools
    let insertedCount = 0;
    if (toolsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('tools')
        .insert(toolsToInsert);

      if (insertError) {
        console.error('Error inserting tools:', insertError);
        return NextResponse.json(
          { success: false, error: 'Failed to insert tools', details: insertError.message },
          { status: 500 }
        );
      }
      insertedCount = toolsToInsert.length;
    }

    // Update existing tools
    let updatedCount = 0;
    for (const tool of toolsToUpdate) {
      const { error: updateError } = await supabase
        .from('tools')
        .update({
          name: tool.name,
          tool_type: tool.tool_type,
          category: tool.category,
          icon: tool.icon,
          short_description: tool.short_description,
          description: tool.description,
          config: tool.config,
          status: tool.status,
          is_public: tool.is_public,
          is_premium: tool.is_premium,
          version: tool.version,
        })
        .eq('id', tool.id);

      if (!updateError) {
        updatedCount++;
      } else {
        console.warn(`Failed to update tool ${tool.id}:`, updateError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Tools synced successfully',
      stats: {
        seedToolsCount: SEED_TOOLS.length,
        existingToolsCount: existingTools?.length || 0,
        insertedCount,
        updatedCount,
      },
    });
  } catch (error) {
    console.error('Sync tools error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync tools', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/sync-tools
 *
 * Preview what would happen if sync was run (dry run)
 */
export async function GET() {
  try {
    const supabase = createServiceClient();

    // Check current tools in database
    const { data: existingTools, error: checkError } = await supabase
      .from('tools')
      .select('id, slug, name');

    if (checkError) {
      return NextResponse.json(
        { success: false, error: 'Failed to check existing tools', details: checkError.message },
        { status: 500 }
      );
    }

    const existingIds = new Set(existingTools?.map(t => t.id) || []);
    const existingSlugs = new Set(existingTools?.map(t => t.slug) || []);

    const analysis = {
      seedTools: SEED_TOOLS.map(t => ({ id: t.id, slug: t.slug, name: t.name })),
      existingTools: existingTools || [],
      wouldInsert: SEED_TOOLS.filter(t => !existingIds.has(t.id) && !existingSlugs.has(t.slug)).map(t => t.id),
      wouldUpdate: SEED_TOOLS.filter(t => existingIds.has(t.id)).map(t => t.id),
      conflicts: SEED_TOOLS.filter(t => !existingIds.has(t.id) && existingSlugs.has(t.slug)).map(t => ({
        seedId: t.id,
        slug: t.slug,
        existingId: existingTools?.find(e => e.slug === t.slug)?.id,
      })),
    };

    return NextResponse.json({
      success: true,
      dryRun: true,
      message: 'Use POST to actually sync tools',
      analysis,
    });
  } catch (error) {
    console.error('Sync tools preview error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to preview sync', details: String(error) },
      { status: 500 }
    );
  }
}
