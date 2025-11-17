
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DeployService } from '@/lib/services/deploy-service';
import { BuildService } from '@/lib/services/build-service';
import { join } from 'path';

/**
 * POST /api/previews/deploy
 * Deploy a build to preview environment
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { buildId, runId } = body;

    // Validate required fields
    if (!buildId || !runId) {
      return NextResponse.json(
        { error: 'Missing required fields: buildId, runId' },
        { status: 400 }
      );
    }

    // Verify build exists and user owns it
    const build = await BuildService.getBuildStatus(buildId);

    if (!build) {
      return NextResponse.json({ error: 'Build not found' }, { status: 404 });
    }

    if (build.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (build.status !== 'completed') {
      return NextResponse.json(
        { error: `Cannot deploy build with status: ${build.status}` },
        { status: 400 }
      );
    }

    // Check if there's already an active preview for this build
    const existingPreview = await DeployService.getActiveDeploymentForBuild(buildId);
    if (existingPreview && existingPreview.status === 'running') {
      return NextResponse.json({
        success: true,
        message: 'Preview already running',
        preview: existingPreview
      });
    }

    // Deploy preview
    const buildPath = join('/tmp/mindous-builds', runId);
    const preview = await DeployService.deployPreview({
      buildId,
      runId,
      buildPath
    });

    return NextResponse.json({
      success: true,
      preview
    }, { status: 201 });

  } catch (error: any) {
    console.error('Preview deployment failed:', error);
    return NextResponse.json(
      { 
        error: 'Preview deployment failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
