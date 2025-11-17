
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getToolRun } from '@/actions/tools';

/**
 * GET /api/tools/runs/:runId
 * Get tool run details including events
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await getToolRun(params.runId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Tool run not found' ? 404 : 500 }
      );
    }

    return NextResponse.json({
      toolRun: result.toolRun,
      events: result.events
    });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
