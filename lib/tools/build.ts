
import { type ToolManifest } from '@/db/schema';
import { BuildService, ProjectSpec } from '@/lib/services/build-service';
import { DeployService } from '@/lib/services/deploy-service';

/**
 * Build Tool
 * Builds Next.js/React projects using BuildService
 */
export const buildToolManifest: ToolManifest = {
  key: 'build_tool',
  version: '2.0.0',
  description: 'Build and deploy Next.js, React, or other JavaScript projects',
  inputSchema: {
    type: 'object',
    required: ['runId', 'projectName'],
    properties: {
      runId: {
        type: 'string',
        description: 'Run ID for this build'
      },
      executionId: {
        type: 'string',
        description: 'Execution ID (optional)'
      },
      userId: {
        type: 'string',
        description: 'User ID'
      },
      projectName: {
        type: 'string',
        description: 'Name of the project'
      },
      projectType: {
        type: 'string',
        enum: ['nextjs', 'react', 'html', 'nodejs', 'other'],
        description: 'Type of project to build'
      },
      files: {
        type: 'array',
        description: 'Files to generate',
        items: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            content: { type: 'string' }
          },
          required: ['path', 'content']
        }
      },
      dependencies: {
        type: 'object',
        description: 'Additional npm dependencies'
      },
      autoDeploy: {
        type: 'boolean',
        description: 'Automatically deploy after build'
      }
    },
    additionalProperties: false
  },
  outputSchema: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        description: 'Whether the build succeeded'
      },
      buildId: {
        type: 'string',
        description: 'Build ID'
      },
      buildPath: {
        type: 'string',
        description: 'Build directory path'
      },
      outputPath: {
        type: 'string',
        description: 'Build output path'
      },
      logs: {
        type: 'string',
        description: 'Build logs'
      },
      error: {
        type: 'string',
        description: 'Error message if build failed'
      },
      durationMs: {
        type: 'number',
        description: 'Build duration in milliseconds'
      },
      previewUrl: {
        type: 'string',
        description: 'Preview URL (if autoDeploy is true)'
      }
    },
    required: ['success']
  },
  resources: {
    timeoutSec: 300, // 5 minutes
    memMb: 2048,
    cpuShares: 512
  },
  container: {
    image: 'mindous/tool-build:2.0.0',
    cmd: ['node', 'index.js'],
    argsTemplate: ['--input', '/work/input.json', '--output', '/work/output.json']
  },
  permissions: {
    network: {
      enabled: true // Need network for npm install
    },
    filesystem: {
      tempDirMb: 1024
    }
  }
};

/**
 * Execute build tool with BuildService integration
 */
export async function executeBuild(input: {
  runId: string;
  executionId?: string;
  userId: string;
  projectName: string;
  projectType?: 'nextjs' | 'react' | 'html' | 'nodejs' | 'other';
  files?: Array<{ path: string; content: string }>;
  dependencies?: Record<string, string>;
  metadata?: any;
  autoDeploy?: boolean;
}): Promise<{
  success: boolean;
  buildId?: string;
  buildPath?: string;
  outputPath?: string;
  logs?: string;
  error?: string;
  durationMs: number;
  previewUrl?: string;
  previewPort?: number;
}> {
  const startTime = Date.now();

  try {
    console.log(`🔨 Building project: ${input.projectName}`);

    // Create project spec
    const spec: ProjectSpec = {
      runId: input.runId,
      executionId: input.executionId,
      userId: input.userId,
      projectName: input.projectName,
      projectType: input.projectType || 'nextjs',
      files: input.files || [],
      dependencies: input.dependencies || {},
      metadata: input.metadata || {}
    };

    // Create and build project
    const buildId = await BuildService.createProject(spec);
    const buildResult = await BuildService.buildProject(buildId, input.runId);

    // Auto-deploy if requested and build succeeded
    let previewUrl: string | undefined;
    let previewPort: number | undefined;
    
    if (input.autoDeploy && buildResult.success) {
      try {
        console.log(`🚀 Auto-deploying preview...`);
        const preview = await DeployService.deployPreview({
          buildId,
          runId: input.runId,
          buildPath: buildResult.buildPath
        });
        previewUrl = preview.previewUrl;
        previewPort = preview.port;
        console.log(`✅ Preview deployed: ${previewUrl}`);
      } catch (deployError: any) {
        console.error('Auto-deploy failed:', deployError);
        // Continue even if deploy fails
      }
    }

    const durationMs = Date.now() - startTime;

    return {
      success: buildResult.success,
      buildId,
      buildPath: buildResult.buildPath,
      outputPath: buildResult.outputPath,
      logs: buildResult.logs,
      error: buildResult.error,
      durationMs,
      previewUrl,
      previewPort
    };

  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    console.error('Build execution failed:', error);
    
    return {
      success: false,
      error: error.message,
      durationMs
    };
  }
}
