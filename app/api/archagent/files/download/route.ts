
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { buildsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

/**
 * POST /api/archagent/files/download
 * Download files as ZIP archive
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { buildId, runId, paths } = body;

    if (!buildId && !runId) {
      return NextResponse.json(
        { error: 'buildId or runId is required' },
        { status: 400 }
      );
    }

    // Get build details
    let build;
    if (buildId) {
      [build] = await db
        .select()
        .from(buildsTable)
        .where(eq(buildsTable.id, buildId))
        .limit(1);
    }

    if (!build) {
      return NextResponse.json({ error: 'Build not found' }, { status: 404 });
    }

    // Get build directory path
    const buildPath = build.outputPath || `/tmp/builds/${buildId}`;

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Handle archive errors
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      throw err;
    });

    // Add files to archive
    if (paths && Array.isArray(paths) && paths.length > 0) {
      // Add specific files
      for (const filePath of paths) {
        const fullPath = path.join(buildPath, filePath);
        try {
          const stat = await fs.promises.stat(fullPath);
          if (stat.isFile()) {
            archive.file(fullPath, { name: filePath });
          } else if (stat.isDirectory()) {
            archive.directory(fullPath, filePath);
          }
        } catch (error) {
          console.error(`Error adding ${filePath}:`, error);
        }
      }
    } else {
      // Add entire directory
      archive.directory(buildPath, false);
    }

    // Finalize the archive
    await archive.finalize();

    // Convert archive stream to Web Readable Stream
    const webStream = Readable.toWeb(archive as any) as ReadableStream;

    return new Response(webStream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${buildId || runId}-files.zip"`,
      },
    });
  } catch (error) {
    console.error('File download API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

