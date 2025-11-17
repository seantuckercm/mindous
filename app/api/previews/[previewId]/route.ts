
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DeployService } from '@/lib/services/deploy-service';
import { BuildService } from '@/lib/services/build-service';

/**
 * GET /api/previews/[previewId]
 * Get preview deployment info
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ previewId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { previewId } = await params;

    // Get preview info
    const preview = await DeployService.getDeploymentInfo(previewId);

    if (!preview) {
      return NextResponse.json({ error: 'Preview not found' }, { status: 404 });
    }

    // Verify ownership
    const build = await BuildService.getBuildStatus(preview.buildId);
    if (build?.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check health
    const isHealthy = await DeployService.checkDeploymentHealth(previewId);

    return NextResponse.json({
      success: true,
      preview: {
        ...preview,
        healthy: isHealthy
      }
    });

  } catch (error: any) {
    console.error('Failed to get preview:', error);
    return NextResponse.json(
      { error: 'Failed to get preview', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/previews/[previewId]
 * Stop preview deployment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ previewId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { previewId } = await params;

    // Get preview info
    const preview = await DeployService.getDeploymentInfo(previewId);

    if (!preview) {
      return NextResponse.json({ error: 'Preview not found' }, { status: 404 });
    }

    // Verify ownership
    const build = await BuildService.getBuildStatus(preview.buildId);
    if (build?.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Stop deployment
    await DeployService.stopDeployment(previewId);

    return NextResponse.json({
      success: true,
      message: 'Preview stopped successfully'
    });

  } catch (error: any) {
    console.error('Failed to stop preview:', error);
    return NextResponse.json(
      { error: 'Failed to stop preview', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/previews/[previewId]/restart
 * Restart preview deployment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ previewId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { previewId } = await params;

    // Get preview info
    const preview = await DeployService.getDeploymentInfo(previewId);

    if (!preview) {
      return NextResponse.json({ error: 'Preview not found' }, { status: 404 });
    }

    // Verify ownership
    const build = await BuildService.getBuildStatus(preview.buildId);
    if (build?.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Restart deployment
    const restartedPreview = await DeployService.restartDeployment(previewId);

    return NextResponse.json({
      success: true,
      preview: restartedPreview
    });

  } catch (error: any) {
    console.error('Failed to restart preview:', error);
    return NextResponse.json(
      { error: 'Failed to restart preview', details: error.message },
      { status: 500 }
    );
  }
}
