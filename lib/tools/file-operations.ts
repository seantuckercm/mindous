
import { type ToolManifest } from '@/db/schema';
import { writeFile, readFile, unlink, mkdir, stat, readdir } from 'fs/promises';
import { join, dirname, relative, basename } from 'path';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

/**
 * File Operations Tool
 * Performs file system operations (create, read, update, delete, search, tree, metadata)
 */
export const fileOperationsManifest: ToolManifest = {
  key: 'file_operations',
  version: '2.0.0',
  description: 'Perform comprehensive file system operations including CRUD, search, tree listing, and metadata',
  inputSchema: {
    type: 'object',
    required: ['operation'],
    properties: {
      operation: {
        type: 'string',
        enum: ['create', 'read', 'update', 'delete', 'mkdir', 'search', 'tree', 'metadata', 'list'],
        description: 'File operation to perform'
      },
      path: {
        type: 'string',
        description: 'Relative path to the file or directory'
      },
      projectPath: {
        type: 'string',
        description: 'Base project directory path'
      },
      content: {
        type: 'string',
        description: 'File content (for create/update operations)'
      },
      encoding: {
        type: 'string',
        enum: ['utf-8', 'base64', 'hex'],
        default: 'utf-8',
        description: 'File encoding (utf-8 for text, base64 for binary)'
      },
      pattern: {
        type: 'string',
        description: 'Search pattern (for search operation)'
      },
      maxDepth: {
        type: 'integer',
        minimum: 1,
        maximum: 10,
        default: 5,
        description: 'Maximum directory depth (for tree/search operations)'
      },
      includeHidden: {
        type: 'boolean',
        default: false,
        description: 'Include hidden files and directories'
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
      },
      metadata: {
        type: 'object',
        description: 'File metadata (for metadata operation)'
      },
      tree: {
        type: 'array',
        description: 'Directory tree structure (for tree operation)'
      },
      files: {
        type: 'array',
        description: 'List of files (for list/search operations)'
      },
      matches: {
        type: 'array',
        description: 'Search results with line numbers (for search operation)'
      }
    },
    required: ['success', 'operation']
  },
  resources: {
    timeoutSec: 60,
    memMb: 512,
    cpuShares: 256
  },
  container: {
    image: 'mindous/tool-file-operations:2.0.0',
    cmd: ['node', 'index.js'],
    argsTemplate: ['--input', '/work/input.json', '--output', '/work/output.json']
  },
  permissions: {
    network: {
      enabled: false
    },
    filesystem: {
      tempDirMb: 1024
    }
  }
};

export interface FileOperationInput {
  operation: 'create' | 'read' | 'update' | 'delete' | 'mkdir' | 'search' | 'tree' | 'metadata' | 'list';
  path?: string;
  projectPath: string;
  content?: string;
  encoding?: 'utf-8' | 'base64' | 'hex';
  pattern?: string;
  maxDepth?: number;
  includeHidden?: boolean;
}

export interface FileMetadata {
  path: string;
  name: string;
  size: number;
  isFile: boolean;
  isDirectory: boolean;
  created: Date;
  modified: Date;
  accessed: Date;
}

export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: TreeNode[];
}

export interface SearchMatch {
  file: string;
  line: number;
  content: string;
  match: string;
}

/**
 * Execute file operations tool
 */
export async function executeFileOperation(input: FileOperationInput): Promise<any> {
  const { operation, projectPath, path = '', encoding = 'utf-8' } = input;
  const fullPath = join(projectPath, path);

  try {
    switch (operation) {
      case 'create':
      case 'update':
        return await createOrUpdateFile(fullPath, input.content || '', encoding as any, operation);

      case 'read':
        return await readFileContent(fullPath, encoding as any, operation);

      case 'delete':
        await unlink(fullPath);
        return { success: true, path: fullPath, operation };

      case 'mkdir':
        await mkdir(fullPath, { recursive: true });
        return { success: true, path: fullPath, operation };

      case 'metadata':
        const metadata = await getFileMetadata(fullPath);
        return { success: true, path: fullPath, operation, metadata };

      case 'list':
        const files = await listFiles(fullPath, input.includeHidden || false);
        return { success: true, path: fullPath, operation, files };

      case 'tree':
        const tree = await buildDirectoryTree(fullPath, input.maxDepth || 5, input.includeHidden || false);
        return { success: true, path: fullPath, operation, tree };

      case 'search':
        if (!input.pattern) {
          throw new Error('Search pattern is required for search operation');
        }
        const matches = await searchInFiles(fullPath, input.pattern, input.maxDepth || 5);
        return { success: true, path: fullPath, operation, matches };

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  } catch (error: any) {
    throw new Error(`File operation failed: ${error.message}`);
  }
}

/**
 * Create or update a file
 */
async function createOrUpdateFile(
  fullPath: string,
  content: string,
  encoding: BufferEncoding,
  operation: string
): Promise<any> {
  const dir = dirname(fullPath);
  await mkdir(dir, { recursive: true });

  if (encoding === 'base64') {
    // Handle binary files
    const buffer = Buffer.from(content, 'base64');
    await writeFile(fullPath, buffer);
  } else {
    await writeFile(fullPath, content, encoding);
  }

  return { success: true, path: fullPath, operation };
}

/**
 * Read file content
 */
async function readFileContent(
  fullPath: string,
  encoding: BufferEncoding,
  operation: string
): Promise<any> {
  if (encoding === 'base64') {
    // Read binary file as base64
    const buffer = await readFile(fullPath);
    const content = buffer.toString('base64');
    return { success: true, content, path: fullPath, operation, encoding };
  } else {
    const content = await readFile(fullPath, encoding);
    return { success: true, content, path: fullPath, operation };
  }
}

/**
 * Get file metadata
 */
async function getFileMetadata(fullPath: string): Promise<FileMetadata> {
  const stats = await stat(fullPath);
  return {
    path: fullPath,
    name: basename(fullPath),
    size: stats.size,
    isFile: stats.isFile(),
    isDirectory: stats.isDirectory(),
    created: stats.birthtime,
    modified: stats.mtime,
    accessed: stats.atime
  };
}

/**
 * List files in a directory
 */
async function listFiles(dirPath: string, includeHidden: boolean): Promise<FileMetadata[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const files: FileMetadata[] = [];

  for (const entry of entries) {
    if (!includeHidden && entry.name.startsWith('.')) {
      continue;
    }

    const fullPath = join(dirPath, entry.name);
    const stats = await stat(fullPath);

    files.push({
      path: fullPath,
      name: entry.name,
      size: stats.size,
      isFile: entry.isFile(),
      isDirectory: entry.isDirectory(),
      created: stats.birthtime,
      modified: stats.mtime,
      accessed: stats.atime
    });
  }

  return files;
}

/**
 * Build directory tree structure
 */
async function buildDirectoryTree(
  dirPath: string,
  maxDepth: number,
  includeHidden: boolean,
  currentDepth: number = 0
): Promise<TreeNode[]> {
  if (currentDepth >= maxDepth) {
    return [];
  }

  const entries = await readdir(dirPath, { withFileTypes: true });
  const tree: TreeNode[] = [];

  for (const entry of entries) {
    if (!includeHidden && entry.name.startsWith('.')) {
      continue;
    }

    const fullPath = join(dirPath, entry.name);
    const stats = await stat(fullPath);

    const node: TreeNode = {
      name: entry.name,
      path: fullPath,
      type: entry.isFile() ? 'file' : 'directory',
      size: entry.isFile() ? stats.size : undefined
    };

    if (entry.isDirectory()) {
      node.children = await buildDirectoryTree(
        fullPath,
        maxDepth,
        includeHidden,
        currentDepth + 1
      );
    }

    tree.push(node);
  }

  return tree;
}

/**
 * Search for pattern in files
 */
async function searchInFiles(
  dirPath: string,
  pattern: string,
  maxDepth: number,
  currentDepth: number = 0
): Promise<SearchMatch[]> {
  if (currentDepth >= maxDepth) {
    return [];
  }

  const matches: SearchMatch[] = [];
  const regex = new RegExp(pattern, 'gi');

  const entries = await readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);

    if (entry.isDirectory()) {
      const subMatches = await searchInFiles(fullPath, pattern, maxDepth, currentDepth + 1);
      matches.push(...subMatches);
    } else if (entry.isFile()) {
      // Only search in text files
      if (isTextFile(entry.name)) {
        try {
          const fileMatches = await searchInFile(fullPath, regex);
          matches.push(...fileMatches);
        } catch (error) {
          // Skip files that can't be read
          console.warn(`[File Search] Skipping ${fullPath}:`, error);
        }
      }
    }
  }

  return matches;
}

/**
 * Search for pattern in a single file
 */
async function searchInFile(filePath: string, regex: RegExp): Promise<SearchMatch[]> {
  const matches: SearchMatch[] = [];
  const fileStream = createReadStream(filePath);
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineNumber = 0;

  for await (const line of rl) {
    lineNumber++;
    const lineMatches = line.match(regex);
    
    if (lineMatches) {
      for (const match of lineMatches) {
        matches.push({
          file: filePath,
          line: lineNumber,
          content: line.trim(),
          match
        });
      }
    }
  }

  return matches;
}

/**
 * Check if a file is likely a text file based on extension
 */
function isTextFile(filename: string): boolean {
  const textExtensions = [
    '.txt', '.md', '.js', '.ts', '.jsx', '.tsx', '.json', '.html', '.css',
    '.scss', '.sass', '.less', '.xml', '.yaml', '.yml', '.toml', '.ini',
    '.sh', '.bash', '.py', '.rb', '.php', '.java', '.c', '.cpp', '.h',
    '.go', '.rs', '.swift', '.kt', '.sql', '.graphql', '.vue', '.svelte'
  ];

  return textExtensions.some(ext => filename.toLowerCase().endsWith(ext));
}
