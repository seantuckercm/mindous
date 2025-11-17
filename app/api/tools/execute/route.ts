
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { invokeTool } from '@/actions/tools';

/**
 * POST /api/tools/execute
 * Execute a tool
 * 
 * Body:
 * {
 *   workspaceId: string,
 *   executionId: string,
 *   toolKey: string,
 *   input: any
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { workspaceId, executionId, toolKey, input } = body;

    if (!workspaceId || !executionId || !toolKey || !input) {
      return NextResponse.json(
        { error: 'workspaceId, executionId, toolKey, and input are required' },
        { status: 400 }
      );
    }

    const result = await invokeTool({
      workspaceId,
      executionId,
      toolKey,
      input
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result.toolRun);
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
