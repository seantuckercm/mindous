
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { executionsTable, runsTable } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/agent/stop/[executionId]
 * Stop/cancel an ongoing execution
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Execution stopped"
 * }
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ executionId: string }> }
) {
  try {
    // Authenticate user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { executionId } = await params;

    // Verify execution exists and belongs to user
    const execution = await db.query.executionsTable.findFirst({
      where: eq(executionsTable.id, executionId),
    });

    if (!execution) {
      return NextResponse.json(
        { success: false, error: 'Execution not found' },
        { status: 404 }
      );
    }

    // Get run to verify ownership
    const run = await db.query.runsTable.findFirst({
      where: and(
        eq(runsTable.executionId, executionId),
        eq(runsTable.userId, userId)
      ),
    });

    if (!run) {
      return NextResponse.json(
        { success: false, error: 'Run not found or access denied' },
        { status: 404 }
      );
    }

    // Check if execution is already finished
    if (execution.status === 'completed' || execution.status === 'failed' || execution.status === 'cancelled') {
      return NextResponse.json(
        {
          success: false,
          error: `Execution already ${execution.status}`,
        },
        { status: 400 }
      );
    }

    console.log(`⚠️ Stopping execution ${executionId} for user ${userId}`);

    // Update execution status to cancelled
    await db
      .update(executionsTable)
      .set({
        status: 'cancelled',
        endTime: new Date(),
      })
      .where(eq(executionsTable.id, executionId));

    // Update run status to cancelled
    await db
      .update(runsTable)
      .set({
        status: 'cancelled',
        completedAt: new Date(),
      })
      .where(eq(runsTable.id, run.id));

    console.log(`✅ Execution ${executionId} stopped`);

    return NextResponse.json({
      success: true,
      message: 'Execution stopped',
      executionId,
    });
  } catch (error: any) {
    console.error('❌ Failed to stop execution:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to stop execution',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
