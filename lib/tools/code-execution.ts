
import { type ToolManifest } from '@/db/schema';
import { spawn } from 'child_process';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

/**
 * Code Execution Tool
 * Executes Python and Node.js code in sandboxed environments
 */
export const codeExecutionManifest: ToolManifest = {
  key: 'code_execution',
  version: '1.0.0',
  description: 'Execute Python or Node.js code in a sandboxed environment with stdout, stderr capture and timeout support',
  inputSchema: {
    type: 'object',
    required: ['code', 'language'],
    properties: {
      code: {
        type: 'string',
        description: 'The code to execute'
      },
      language: {
        type: 'string',
        enum: ['python', 'nodejs', 'javascript'],
        description: 'Programming language of the code'
      },
      timeout: {
        type: 'integer',
        minimum: 1,
        maximum: 300,
        default: 30,
        description: 'Execution timeout in seconds'
      },
      packages: {
        type: 'array',
        items: { type: 'string' },
        description: 'Packages to install before execution (limited support)'
      },
      stdin: {
        type: 'string',
        description: 'Standard input to provide to the program'
      },
      env: {
        type: 'object',
        description: 'Environment variables to set',
        additionalProperties: { type: 'string' }
      }
    },
    additionalProperties: false
  },
  outputSchema: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        description: 'Whether execution completed successfully'
      },
      stdout: {
        type: 'string',
        description: 'Standard output from the program'
      },
      stderr: {
        type: 'string',
        description: 'Standard error from the program'
      },
      exitCode: {
        type: 'integer',
        description: 'Exit code of the program'
      },
      error: {
        type: 'string',
        description: 'Error message if execution failed'
      },
      timeout: {
        type: 'boolean',
        description: 'Whether the execution timed out'
      },
      executionTimeMs: {
        type: 'integer',
        description: 'Execution time in milliseconds'
      }
    },
    required: ['success']
  },
  resources: {
    timeoutSec: 300,
    memMb: 1024,
    cpuShares: 512
  },
  container: {
    image: 'mindous/tool-code-execution:1.0.0',
    cmd: ['node', 'index.js'],
    argsTemplate: ['--input', '/work/input.json', '--output', '/work/output.json']
  },
  permissions: {
    network: {
      enabled: false // Disabled for security
    },
    filesystem: {
      tempDirMb: 512
    }
  }
};

export interface CodeExecutionInput {
  code: string;
  language: 'python' | 'nodejs' | 'javascript';
  timeout?: number;
  packages?: string[];
  stdin?: string;
  env?: Record<string, string>;
}

export interface CodeExecutionOutput {
  success: boolean;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  error?: string;
  timeout?: boolean;
  executionTimeMs?: number;
}

/**
 * Execute code in a sandboxed environment
 */
export async function executeCode(input: CodeExecutionInput): Promise<CodeExecutionOutput> {
  const {
    code,
    language,
    timeout = 30,
    stdin,
    env = {}
  } = input;

  // Create a temporary directory for code execution
  const sessionId = randomBytes(16).toString('hex');
  const workDir = join(tmpdir(), 'mindous-code-exec', sessionId);
  
  try {
    await mkdir(workDir, { recursive: true });

    // Write code to a temporary file
    const extension = language === 'python' ? '.py' : '.js';
    const filename = `exec${extension}`;
    const filepath = join(workDir, filename);
    
    await writeFile(filepath, code, 'utf-8');

    // Determine the command to run
    const command = language === 'python' ? 'python3' : 'node';
    const args = [filepath];

    // Execute the code
    const startTime = Date.now();
    const result = await executeProcess(command, args, {
      cwd: workDir,
      timeout: timeout * 1000,
      stdin,
      env: {
        ...process.env,
        ...env,
        // Security: Limit access
        HOME: workDir,
        PATH: process.env.PATH || '',
      }
    });
    const executionTimeMs = Date.now() - startTime;

    // Clean up
    await cleanup(workDir);

    return {
      ...result,
      executionTimeMs
    };

  } catch (error: any) {
    // Clean up on error
    await cleanup(workDir).catch(() => {});

    return {
      success: false,
      error: error.message,
      stderr: error.stderr,
      executionTimeMs: 0
    };
  }
}

/**
 * Execute a process with timeout and capture output
 */
function executeProcess(
  command: string,
  args: string[],
  options: {
    cwd: string;
    timeout: number;
    stdin?: string;
    env: NodeJS.ProcessEnv;
  }
): Promise<CodeExecutionOutput> {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let didTimeout = false;

    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      shell: false, // Security: Don't use shell
    });

    // Set up timeout
    const timeoutId = setTimeout(() => {
      didTimeout = true;
      child.kill('SIGTERM');
      
      // Force kill after 2 seconds if still alive
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 2000);
    }, options.timeout);

    // Capture stdout
    child.stdout?.on('data', (data) => {
      stdout += data.toString();
      // Limit output size to prevent memory issues
      if (stdout.length > 1024 * 1024) { // 1MB limit
        child.kill('SIGTERM');
      }
    });

    // Capture stderr
    child.stderr?.on('data', (data) => {
      stderr += data.toString();
      // Limit output size to prevent memory issues
      if (stderr.length > 1024 * 1024) { // 1MB limit
        child.kill('SIGTERM');
      }
    });

    // Write stdin if provided
    if (options.stdin) {
      child.stdin?.write(options.stdin);
      child.stdin?.end();
    }

    // Handle process exit
    child.on('exit', (code) => {
      clearTimeout(timeoutId);
      
      resolve({
        success: !didTimeout && code === 0,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: code ?? undefined,
        timeout: didTimeout,
        error: didTimeout ? 'Execution timed out' : undefined
      });
    });

    // Handle errors
    child.on('error', (error) => {
      clearTimeout(timeoutId);
      
      resolve({
        success: false,
        error: error.message,
        stderr: stderr.trim()
      });
    });
  });
}

/**
 * Clean up temporary files
 */
async function cleanup(workDir: string): Promise<void> {
  try {
    const { rm } = await import('fs/promises');
    await rm(workDir, { recursive: true, force: true });
  } catch (error) {
    console.error('[Code Execution] Cleanup error:', error);
  }
}

/**
 * Validate code for obvious security issues
 */
export function validateCode(code: string, language: string): { valid: boolean; reason?: string } {
  // Basic security checks
  const dangerousPatterns = [
    /require\s*\(\s*['"]child_process['"]\s*\)/, // Node.js child_process
    /require\s*\(\s*['"]fs['"]\s*\)/, // Node.js fs (outside sandbox)
    /import\s+.*\s+from\s+['"]child_process['"]/, // ES6 child_process
    /import\s+.*\s+from\s+['"]fs['"]/, // ES6 fs
    /eval\s*\(/, // eval
    /Function\s*\(/, // Function constructor
    /__import__\s*\(\s*['"]os['"]\s*\)/, // Python os
    /__import__\s*\(\s*['"]subprocess['"]\s*\)/, // Python subprocess
    /import\s+os\b/, // Python os import
    /import\s+subprocess\b/, // Python subprocess import
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(code)) {
      return {
        valid: false,
        reason: `Potentially dangerous pattern detected: ${pattern.source}`
      };
    }
  }

  return { valid: true };
}
