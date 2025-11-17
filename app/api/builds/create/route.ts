
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { BuildService, ProjectSpec } from '@/lib/services/build-service';
import { DeployService } from '@/lib/services/deploy-service';

/**
 * POST /api/builds/create
 * Create and build a new project
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      runId, 
      executionId, 
      projectName, 
      projectType = 'nextjs',
      files = [],
      dependencies = {},
      metadata = {},
      autoDeploy = false
    } = body;

    // Validate required fields
    if (!runId || !projectName) {
      return NextResponse.json(
        { error: 'Missing required fields: runId, projectName' },
        { status: 400 }
      );
    }

    // Create project spec
    const spec: ProjectSpec = {
      runId,
      executionId,
      userId,
      projectName,
      projectType,
      files,
      dependencies,
      metadata
    };

    // Create project
    const buildId = await BuildService.createProject(spec);

    // Build project
    const buildResult = await BuildService.buildProject(buildId, runId);

    // Auto-deploy if requested and build succeeded
    let previewInfo = null;
    if (autoDeploy && buildResult.success) {
      try {
        previewInfo = await DeployService.deployPreview({
          buildId,
          runId,
          buildPath: buildResult.buildPath
        });
      } catch (deployError: any) {
        console.error('Auto-deploy failed:', deployError);
        // Continue even if deploy fails
      }
    }

    return NextResponse.json({
      success: true,
      buildId,
      build: {
        ...buildResult,
        status: buildResult.success ? 'completed' : 'failed'
      },
      preview: previewInfo
    }, { status: 201 });

  } catch (error: any) {
    console.error('Build creation failed:', error);
    return NextResponse.json(
      { 
        error: 'Build creation failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
