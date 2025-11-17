
import { type ToolManifest } from '@/db/schema';
import { writeFile, readFile, unlink, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

/**
 * File Operations Tool
 * Performs file system operations (create, read, update, delete)
 */
export const fileOperationsManifest: ToolManifest = {
  key: 'file_operations',
  version: '1.0.0',
  description: 'Perform file system operations (create, read, update, delete files)',
  inputSchema: {
    type: 'object',
    required: ['operation', 'path', 'projectPath'],
    properties: {
      operation: {
        type: 'string',
        enum: ['create', 'read', 'update', 'delete', 'mkdir'],
        description: 'File operation to perform'
      },
      path: {
        type: 'string',
        description: 'Relative path to the file'
      },
      projectPath: {
        type: 'string',
        description: 'Base project directory path'
      },
      content: {
        type: 'string',
        description: 'File content (for create/update operations)'
      }
    },
    additionalProperties: false
  },
  outputSchema: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        description: 'Whether the operation succeeded'
      },
      content: {
        type: 'string',
        description: 'File content (for read operation)'
      },
      path: {
        type: 'string',
        description: 'Full path to the file'
      },
      operation: {
        type: 'string',
        description: 'Operation performed'
      }
    },
    required: ['success', 'operation']
  },
  resources: {
    timeoutSec: 30,
    memMb: 256,
    cpuShares: 128
  },
  container: {
    image: 'mindous/tool-file-operations:1.0.0',
    cmd: ['node', 'index.js'],
    argsTemplate: ['--input', '/work/input.json', '--output', '/work/output.json']
  },
  permissions: {
    network: {
      enabled: false
    },
    filesystem: {
      tempDirMb: 512
    }
  }
};

/**
 * Execute file operations tool
 */
export async function executeFileOperation(input: {
  operation: 'create' | 'read' | 'update' | 'delete' | 'mkdir';
  path: string;
  projectPath: string;
  content?: string;
}): Promise<{ success: boolean; content?: string; path: string; operation: string }> {
  const fullPath = join(input.projectPath, input.path);

  try {
    switch (input.operation) {
      case 'create':
      case 'update':
        // Create parent directories if they don't exist
        const dir = dirname(fullPath);
        await mkdir(dir, { recursive: true });
        await writeFile(fullPath, input.content || '', 'utf-8');
        return { success: true, path: fullPath, operation: input.operation };

      case 'read':
        const content = await readFile(fullPath, 'utf-8');
        return { success: true, content, path: fullPath, operation: input.operation };

      case 'delete':
        await unlink(fullPath);
        return { success: true, path: fullPath, operation: input.operation };

      case 'mkdir':
        await mkdir(fullPath, { recursive: true });
        return { success: true, path: fullPath, operation: input.operation };

      default:
        throw new Error(`Unknown operation: ${input.operation}`);
    }
  } catch (error: any) {
    throw new Error(`File operation failed: ${error.message}`);
  }
}
