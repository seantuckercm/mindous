
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { BuildService } from '@/lib/services/build-service';

/**
 * GET /api/builds/[buildId]
 * Get build details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ buildId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { buildId } = await params;

    // Get build status
    const build = await BuildService.getBuildStatus(buildId);

    if (!build) {
      return NextResponse.json({ error: 'Build not found' }, { status: 404 });
    }

    // Check if user owns this build
    if (build.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get artifacts
    const artifacts = await BuildService.listArtifacts(buildId);

    return NextResponse.json({
      success: true,
      build: {
        id: build.id,
        runId: build.runId,
        projectName: build.projectName,
        projectType: build.projectType,
        status: build.status,
        buildPath: build.buildPath,
        outputPath: build.outputPath,
        errorMessage: build.errorMessage,
        startedAt: build.startedAt,
        completedAt: build.completedAt,
        durationMs: build.durationMs,
        sizeBytes: build.sizeBytes,
        metadata: build.metadata,
        createdAt: build.createdAt,
        artifactCount: artifacts.length
      },
      artifacts: artifacts.map(a => ({
        id: a.id,
        filePath: a.filePath,
        fileType: a.fileType,
        sizeBytes: a.sizeBytes,
        mimeType: a.mimeType,
        isGenerated: a.isGenerated === 1
      }))
    });

  } catch (error: any) {
    console.error('Failed to get build:', error);
    return NextResponse.json(
      { error: 'Failed to get build', details: error.message },
      { status: 500 }
    );
  }
}
