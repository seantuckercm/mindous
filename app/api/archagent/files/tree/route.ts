
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { buildsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';

export interface FileNode {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
  children?: FileNode[];
}

async function buildFileTree(
  dirPath: string,
  relativePath: string = ''
): Promise<FileNode> {
  const stat = await fs.stat(dirPath);
  const name = relativePath || path.basename(dirPath);

  if (stat.isDirectory()) {
    try {
      const entries = await fs.readdir(dirPath);
      const children: FileNode[] = [];

      for (const entry of entries) {
        // Skip node_modules, .git, and .next directories
        if (['node_modules', '.git', '.next', '.cache'].includes(entry)) {
          continue;
        }

        try {
          const fullPath = path.join(dirPath, entry);
          const childRelativePath = relativePath
            ? path.join(relativePath, entry)
            : entry;
          const childNode = await buildFileTree(fullPath, childRelativePath);
          children.push(childNode);
        } catch (error) {
          console.error(`Error processing ${entry}:`, error);
        }
      }

      // Sort: directories first, then files alphabetically
      children.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      return {
        name,
        path: relativePath || '/',
        type: 'directory',
        children
      };
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error);
      return {
        name,
        path: relativePath || '/',
        type: 'directory',
        children: []
      };
    }
  }

  return {
    name,
    path: relativePath,
    type: 'file',
    size: stat.size,
    modified: stat.mtime
  };
}

/**
 * GET /api/archagent/files/tree?buildId=xxx
 * Get file tree for a build
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const buildId = searchParams.get('buildId');
    const runId = searchParams.get('runId');

    if (!buildId && !runId) {
      return NextResponse.json(
        { error: 'buildId or runId is required' },
        { status: 400 }
      );
    }

    // Get build details
    let build;
    if (buildId) {
      try {
        [build] = await db
          .select()
          .from(buildsTable)
          .where(eq(buildsTable.id, buildId))
          .limit(1);
      } catch (error) {
        console.log('Build not found in database, returning demo tree');
      }
    }

    // If no build found, return a demo file tree for testing
    if (!build) {
      const demoTree: FileNode = {
        name: 'demo-project',
        path: '/',
        type: 'directory',
        children: [
          {
            name: 'src',
            path: 'src',
            type: 'directory',
            children: [
              {
                name: 'app',
                path: 'src/app',
                type: 'directory',
                children: [
                  {
                    name: 'page.tsx',
                    path: 'src/app/page.tsx',
                    type: 'file',
                    size: 1234,
                    modified: new Date()
                  },
                  {
                    name: 'layout.tsx',
                    path: 'src/app/layout.tsx',
                    type: 'file',
                    size: 2345,
                    modified: new Date()
                  }
                ]
              },
              {
                name: 'components',
                path: 'src/components',
                type: 'directory',
                children: [
                  {
                    name: 'Header.tsx',
                    path: 'src/components/Header.tsx',
                    type: 'file',
                    size: 567,
                    modified: new Date()
                  }
                ]
              }
            ]
          },
          {
            name: 'public',
            path: 'public',
            type: 'directory',
            children: [
              {
                name: 'logo.png',
                path: 'public/logo.png',
                type: 'file',
                size: 4567,
                modified: new Date()
              }
            ]
          },
          {
            name: 'package.json',
            path: 'package.json',
            type: 'file',
            size: 890,
            modified: new Date()
          },
          {
            name: 'README.md',
            path: 'README.md',
            type: 'file',
            size: 456,
            modified: new Date()
          }
        ]
      };

      return NextResponse.json({
        success: true,
        tree: demoTree,
        demo: true
      });
    }

    // Get build directory path
    const buildPath = build.outputPath || `/tmp/builds/${buildId}`;

    // Check if directory exists
    try {
      await fs.access(buildPath);
    } catch {
      return NextResponse.json(
        { error: 'Build directory not found' },
        { status: 404 }
      );
    }

    // Build file tree
    const tree = await buildFileTree(buildPath);

    return NextResponse.json({
      success: true,
      tree
    });
  } catch (error) {
    console.error('File tree API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

