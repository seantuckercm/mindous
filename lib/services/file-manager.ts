import { createClient } from '@supabase/supabase-js';
import { writeFile, readFile, mkdir, rm, stat, readdir, copyFile } from 'fs/promises';
import { join, dirname, basename, extname } from 'path';
import { spawn } from 'child_process';
import { existsSync } from 'fs';

/**
 * File Manager Service
 * Handles file system operations, temporary build directories,
 * and Supabase Storage integration for artifacts
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUILDS_BASE_DIR = '/tmp/mindous-builds';
const STORAGE_BUCKET = 'mindous-artifacts';

export class FileManager {
  /**
   * Create temporary build directory for a run
   */
  static async createBuildDir(runId: string): Promise<string> {
    const buildPath = join(BUILDS_BASE_DIR, runId);
    await mkdir(buildPath, { recursive: true });
    console.log(`📁 Created build directory: ${buildPath}`);
    return buildPath;
  }

  /**
   * Save file to temporary storage
   */
  static async saveTempFile(
    runId: string,
    relativePath: string,
    content: string | Buffer
  ): Promise<string> {
    const buildPath = await this.createBuildDir(runId);
    const fullPath = join(buildPath, relativePath);
    
    // Create parent directories
    const dir = dirname(fullPath);
    await mkdir(dir, { recursive: true });
    
    await writeFile(fullPath, content, typeof content === 'string' ? 'utf-8' : undefined);
    console.log(`💾 Saved file: ${relativePath}`);
    return fullPath;
  }

  /**
   * Read file from temporary storage
   */
  static async readTempFile(runId: string, relativePath: string): Promise<string> {
    const buildPath = join(BUILDS_BASE_DIR, runId);
    const fullPath = join(buildPath, relativePath);
    return await readFile(fullPath, 'utf-8');
  }

  /**
   * Check if file exists
   */
  static async fileExists(runId: string, relativePath: string): Promise<boolean> {
    const buildPath = join(BUILDS_BASE_DIR, runId);
    const fullPath = join(buildPath, relativePath);
    return existsSync(fullPath);
  }

  /**
   * Copy directory recursively
   */
  static async copyDirectory(source: string, destination: string): Promise<void> {
    await mkdir(destination, { recursive: true });
    
    const entries = await readdir(source, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = join(source, entry.name);
      const destPath = join(destination, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await copyFile(srcPath, destPath);
      }
    }
  }

  /**
   * Scaffold project from template
   */
  static async scaffoldFromTemplate(
    templatePath: string,
    runId: string
  ): Promise<string> {
    const buildPath = await this.createBuildDir(runId);
    await this.copyDirectory(templatePath, buildPath);
    console.log(`🏗️ Scaffolded project from template: ${templatePath}`);
    return buildPath;
  }

  /**
   * Upload file to Supabase Storage
   */
  static async uploadToStorage(
    userId: string,
    runId: string,
    filename: string,
    content: Buffer | string
  ): Promise<string> {
    const path = `${userId}/${runId}/${filename}`;
    
    const buffer = typeof content === 'string' ? Buffer.from(content) : content;
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, buffer, {
        contentType: this.getContentType(filename),
        upsert: true
      });
    
    if (error) {
      console.error('Failed to upload to storage:', error);
      throw new Error(`Storage upload failed: ${error.message}`);
    }
    
    console.log(`☁️ Uploaded to storage: ${path}`);
    return data.path;
  }

  /**
   * Upload multiple files to storage
   */
  static async uploadMultipleToStorage(
    userId: string,
    runId: string,
    files: Array<{ filename: string; content: Buffer | string }>
  ): Promise<string[]> {
    const paths: string[] = [];
    
    for (const file of files) {
      const path = await this.uploadToStorage(userId, runId, file.filename, file.content);
      paths.push(path);
    }
    
    return paths;
  }

  /**
   * Download from Supabase Storage
   */
  static async downloadFromStorage(path: string): Promise<Buffer> {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(path);
    
    if (error) {
      console.error('Failed to download from storage:', error);
      throw new Error(`Storage download failed: ${error.message}`);
    }
    
    return Buffer.from(await data.arrayBuffer());
  }

  /**
   * Get public URL for a storage file
   */
  static async getPublicUrl(path: string): Promise<string> {
    const { data } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  /**
   * Clean up temporary build directory
   */
  static async cleanupBuildDir(runId: string): Promise<void> {
    const buildPath = join(BUILDS_BASE_DIR, runId);
    
    if (existsSync(buildPath)) {
      await rm(buildPath, { recursive: true, force: true });
      console.log(`🗑️ Cleaned up build directory: ${runId}`);
    }
  }

  /**
   * Archive build directory to tar.gz
   */
  static async archiveBuild(runId: string): Promise<string> {
    const buildPath = join(BUILDS_BASE_DIR, runId);
    const archivePath = join(BUILDS_BASE_DIR, `${runId}.tar.gz`);
    
    return new Promise((resolve, reject) => {
      const process = spawn('tar', ['-czf', archivePath, '-C', buildPath, '.']);
      
      let stderr = '';
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          console.log(`📦 Archived build: ${archivePath}`);
          resolve(archivePath);
        } else {
          reject(new Error(`tar failed with code ${code}: ${stderr}`));
        }
      });
      
      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Get directory size in bytes
   */
  static async getDirectorySize(path: string): Promise<number> {
    let size = 0;
    
    const entries = await readdir(path, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(path, entry.name);
      
      if (entry.isDirectory()) {
        size += await this.getDirectorySize(fullPath);
      } else {
        const stats = await stat(fullPath);
        size += stats.size;
      }
    }
    
    return size;
  }

  /**
   * List files in build directory
   */
  static async listFiles(runId: string, relativePath: string = ''): Promise<string[]> {
    const buildPath = join(BUILDS_BASE_DIR, runId);
    const fullPath = join(buildPath, relativePath);
    
    const files: string[] = [];
    const entries = await readdir(fullPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const entryPath = join(relativePath, entry.name);
      
      if (entry.isDirectory()) {
        const subFiles = await this.listFiles(runId, entryPath);
        files.push(...subFiles);
      } else {
        files.push(entryPath);
      }
    }
    
    return files;
  }

  /**
   * Get content type from filename
   */
  private static getContentType(filename: string): string {
    const ext = extname(filename).toLowerCase();
    
    const types: Record<string, string> = {
      '.ts': 'text/typescript',
      '.tsx': 'text/typescript',
      '.js': 'text/javascript',
      '.jsx': 'text/javascript',
      '.json': 'application/json',
      '.css': 'text/css',
      '.html': 'text/html',
      '.md': 'text/markdown',
      '.txt': 'text/plain',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.pdf': 'application/pdf',
      '.zip': 'application/zip',
      '.tar': 'application/x-tar',
      '.gz': 'application/gzip',
    };
    
    return types[ext] || 'application/octet-stream';
  }

  /**
   * Ensure storage bucket exists
   */
  static async ensureStorageBucket(): Promise<void> {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      
      const bucketExists = buckets?.some(b => b.name === STORAGE_BUCKET);
      
      if (!bucketExists) {
        const { error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
          public: false,
          fileSizeLimit: 1024 * 1024 * 100, // 100MB
        });
        
        if (error) {
          console.error('Failed to create storage bucket:', error);
        } else {
          console.log(`✅ Created storage bucket: ${STORAGE_BUCKET}`);
        }
      }
    } catch (error) {
      console.error('Error checking storage bucket:', error);
    }
  }

  /**
   * Cleanup old builds (older than specified days)
   */
  static async cleanupOldBuilds(daysOld: number = 1): Promise<number> {
    let cleanedCount = 0;
    
    try {
      if (!existsSync(BUILDS_BASE_DIR)) {
        return 0;
      }
      
      const entries = await readdir(BUILDS_BASE_DIR, { withFileTypes: true });
      const now = Date.now();
      const maxAge = daysOld * 24 * 60 * 60 * 1000;
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const path = join(BUILDS_BASE_DIR, entry.name);
          const stats = await stat(path);
          
          if (now - stats.mtimeMs > maxAge) {
            await rm(path, { recursive: true, force: true });
            console.log(`🗑️ Cleaned up old build: ${entry.name}`);
            cleanedCount++;
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up old builds:', error);
    }
    
    return cleanedCount;
  }
}

// Initialize storage bucket on module load
FileManager.ensureStorageBucket().catch(console.error);
