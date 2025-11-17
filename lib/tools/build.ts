
import { type ToolManifest } from '@/db/schema';
import { spawn } from 'child_process';

/**
 * Build Tool
 * Builds Next.js/React projects
 */
export const buildToolManifest: ToolManifest = {
  key: 'build_tool',
  version: '1.0.0',
  description: 'Build Next.js, React, or other JavaScript projects',
  inputSchema: {
    type: 'object',
    required: ['projectPath'],
    properties: {
      projectPath: {
        type: 'string',
        description: 'Path to the project directory'
      },
      buildCommand: {
        type: 'string',
        description: 'Build command to execute (default: "npm run build")'
      },
      installDependencies: {
        type: 'boolean',
        description: 'Whether to install dependencies before building'
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
      output: {
        type: 'string',
        description: 'Build output logs'
      },
      error: {
        type: 'string',
        description: 'Error message if build failed'
      },
      durationMs: {
        type: 'number',
        description: 'Build duration in milliseconds'
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
    image: 'mindous/tool-build:1.0.0',
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
 * Execute build tool
 */
export async function executeBuild(input: {
  projectPath: string;
  buildCommand?: string;
  installDependencies?: boolean;
}): Promise<{ success: boolean; output: string; error?: string; durationMs: number }> {
  const startTime = Date.now();
  const buildCommand = input.buildCommand || 'npm run build';

  try {
    // Install dependencies if requested
    if (input.installDependencies) {
      console.log('Installing dependencies...');
      await executeCommand('npm install', input.projectPath);
    }

    // Run build command
    console.log(`Running build command: ${buildCommand}`);
    const output = await executeCommand(buildCommand, input.projectPath);

    return {
      success: true,
      output,
      durationMs: Date.now() - startTime
    };
  } catch (error: any) {
    return {
      success: false,
      output: error.stdout || '',
      error: error.stderr || error.message,
      durationMs: Date.now() - startTime
    };
  }
}

/**
 * Helper to execute shell commands
 */
function executeCommand(command: string, cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(' ');
    const process = spawn(cmd, args, { cwd, shell: true });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        const error: any = new Error(`Command failed with code ${code}`);
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
      }
    });

    process.on('error', (error) => {
      reject(error);
    });
  });
}
