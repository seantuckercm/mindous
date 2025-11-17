import { db } from '@/db';
import { buildsTable, buildArtifactsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { spawn } from 'child_process';
import { join } from 'path';
import { FileManager } from './file-manager';
import { EventPublisher } from './event-publisher';

/**
 * Build Service
 * Handles project generation, dependency management, and building
 */

export interface ProjectSpec {
  runId: string;
  executionId?: string;
  userId: string;
  projectName: string;
  projectType: 'nextjs' | 'react' | 'html' | 'nodejs' | 'other';
  files?: Array<{
    path: string;
    content: string;
  }>;
  dependencies?: Record<string, string>;
  metadata?: any;
}

export interface BuildResult {
  buildId: string;
  success: boolean;
  buildPath: string;
  outputPath: string;
  logs: string;
  error?: string;
  durationMs: number;
  sizeBytes?: number;
}

export class BuildService {
  /**
   * Create new project from template
   */
  static async createProject(spec: ProjectSpec): Promise<string> {
    console.log(`🏗️ Creating project: ${spec.projectName} (${spec.projectType})`);

    // Create build record
    const [build] = await db.insert(buildsTable).values({
      runId: spec.runId,
      executionId: spec.executionId || null,
      userId: spec.userId,
      projectName: spec.projectName,
      projectType: spec.projectType,
      status: 'queued',
      metadata: spec.metadata || {}
    }).returning();

    // Scaffold from template
    const templatePath = this.getTemplatePath(spec.projectType);
    const buildPath = await FileManager.scaffoldFromTemplate(templatePath, spec.runId);

    // Update build with path
    await db.update(buildsTable)
      .set({ 
        buildPath,
        status: 'installing'
      })
      .where(eq(buildsTable.id, build.id));

    // Add custom files if provided
    if (spec.files && spec.files.length > 0) {
      await this.generateFiles(build.id, spec.runId, spec.files);
    }

    // Update dependencies if provided
    if (spec.dependencies) {
      await this.updateDependencies(spec.runId, spec.dependencies);
    }

    console.log(`✅ Project created: ${build.id}`);
    return build.id;
  }

  /**
   * Generate code files in project
   */
  static async generateFiles(
    buildId: string,
    runId: string,
    files: Array<{ path: string; content: string }>
  ): Promise<void> {
    console.log(`📝 Generating ${files.length} files...`);

    for (const file of files) {
      // Save file to temp storage
      await FileManager.saveTempFile(runId, file.path, file.content);

      // Create artifact record
      await db.insert(buildArtifactsTable).values({
        buildId,
        filePath: file.path,
        fileType: this.getFileType(file.path),
        content: file.content,
        sizeBytes: Buffer.from(file.content).length,
        mimeType: FileManager['getContentType'](file.path),
        isGenerated: 1
      });

      console.log(`  ✓ ${file.path}`);
    }
  }

  /**
   * Update package.json dependencies
   */
  static async updateDependencies(
    runId: string,
    dependencies: Record<string, string>
  ): Promise<void> {
    console.log(`📦 Updating dependencies...`);

    // Read existing package.json
    const packageJsonPath = 'package.json';
    const content = await FileManager.readTempFile(runId, packageJsonPath);
    const packageJson = JSON.parse(content);

    // Merge dependencies
    packageJson.dependencies = {
      ...packageJson.dependencies,
      ...dependencies
    };

    // Write back
    await FileManager.saveTempFile(
      runId,
      packageJsonPath,
      JSON.stringify(packageJson, null, 2)
    );

    console.log(`  ✓ Updated ${Object.keys(dependencies).length} dependencies`);
  }

  /**
   * Install dependencies
   */
  static async installDependencies(buildId: string, runId: string): Promise<void> {
    console.log(`📦 Installing dependencies...`);

    // Update build status
    await db.update(buildsTable)
      .set({ status: 'installing' })
      .where(eq(buildsTable.id, buildId));

    // Publish event
    await EventPublisher.publishBuildEvent(runId, buildId, 'DEPENDENCIES_INSTALLING', 
      'Installing npm dependencies...');

    const buildPath = join('/tmp/mindous-builds', runId);

    try {
      const output = await this.executeCommand('npm install', buildPath, (data) => {
        EventPublisher.publishBuildLog(runId, buildId, data);
      });

      console.log(`  ✅ Dependencies installed`);

      await EventPublisher.publishBuildEvent(runId, buildId, 'DEPENDENCIES_INSTALLED', 
        'Dependencies installed successfully');

    } catch (error: any) {
      console.error('Failed to install dependencies:', error);
      throw new Error(`Dependency installation failed: ${error.message}`);
    }
  }

  /**
   * Build project
   */
  static async buildProject(buildId: string, runId: string): Promise<BuildResult> {
    console.log(`🔨 Building project...`);

    const startTime = Date.now();

    // Update build status
    await db.update(buildsTable)
      .set({ 
        status: 'building',
        startedAt: new Date()
      })
      .where(eq(buildsTable.id, buildId));

    // Publish event
    await EventPublisher.publishBuildEvent(runId, buildId, 'BUILD_RUNNING', 
      'Building project...');

    const buildPath = join('/tmp/mindous-builds', runId);
    let logs = '';

    try {
      // Install dependencies first
      await this.installDependencies(buildId, runId);

      // Run build command
      const buildOutput = await this.executeCommand('npm run build', buildPath, (data) => {
        logs += data;
        EventPublisher.publishBuildLog(runId, buildId, data);
      });

      logs += buildOutput;

      // Get build size
      const outputPath = join(buildPath, '.next');
      const sizeBytes = await FileManager.getDirectorySize(outputPath);

      const durationMs = Date.now() - startTime;

      // Update build as completed
      await db.update(buildsTable)
        .set({ 
          status: 'completed',
          completedAt: new Date(),
          buildLogs: logs,
          outputPath,
          durationMs,
          sizeBytes
        })
        .where(eq(buildsTable.id, buildId));

      // Publish completion event
      await EventPublisher.publishBuildEvent(runId, buildId, 'BUILD_COMPLETED', 
        'Build completed successfully', { durationMs, sizeBytes });

      console.log(`  ✅ Build completed in ${durationMs}ms`);

      return {
        buildId,
        success: true,
        buildPath,
        outputPath,
        logs,
        durationMs,
        sizeBytes
      };

    } catch (error: any) {
      const durationMs = Date.now() - startTime;

      // Update build as failed
      await db.update(buildsTable)
        .set({ 
          status: 'failed',
          completedAt: new Date(),
          buildLogs: logs,
          errorMessage: error.message,
          durationMs
        })
        .where(eq(buildsTable.id, buildId));

      // Publish failure event
      await EventPublisher.publishBuildEvent(runId, buildId, 'BUILD_FAILED', 
        'Build failed', { error: error.message });

      console.error(`  ❌ Build failed:`, error.message);

      return {
        buildId,
        success: false,
        buildPath,
        outputPath: '',
        logs,
        error: error.message,
        durationMs
      };
    }
  }

  /**
   * Execute shell command with real-time output
   */
  private static executeCommand(
    command: string,
    cwd: string,
    onData?: (data: string) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(' ');
      const process = spawn(cmd, args, { cwd, shell: true });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        const str = data.toString();
        stdout += str;
        if (onData) onData(str);
      });

      process.stderr.on('data', (data) => {
        const str = data.toString();
        stderr += str;
        if (onData) onData(str);
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

  /**
   * Get build status
   */
  static async getBuildStatus(buildId: string): Promise<any> {
    const [build] = await db
      .select()
      .from(buildsTable)
      .where(eq(buildsTable.id, buildId));

    return build;
  }

  /**
   * Get build logs
   */
  static async getBuildLogs(buildId: string): Promise<string> {
    const [build] = await db
      .select({ logs: buildsTable.buildLogs })
      .from(buildsTable)
      .where(eq(buildsTable.id, buildId));

    return build?.logs || '';
  }

  /**
   * List build artifacts
   */
  static async listArtifacts(buildId: string): Promise<any[]> {
    return await db
      .select()
      .from(buildArtifactsTable)
      .where(eq(buildArtifactsTable.buildId, buildId));
  }

  /**
   * Archive build artifacts to storage
   */
  static async archiveArtifacts(
    buildId: string,
    userId: string,
    runId: string
  ): Promise<string> {
    console.log(`📦 Archiving build artifacts...`);

    // Create archive
    const archivePath = await FileManager.archiveBuild(runId);

    // Upload to storage
    const content = await FileManager.readTempFile('', archivePath);
    const storagePath = await FileManager.uploadToStorage(
      userId,
      runId,
      `${buildId}.tar.gz`,
      content
    );

    console.log(`  ✅ Archived to: ${storagePath}`);
    return storagePath;
  }

  /**
   * Clean up build
   */
  static async cleanup(runId: string): Promise<void> {
    await FileManager.cleanupBuildDir(runId);
  }

  /**
   * Get template path for project type
   */
  private static getTemplatePath(projectType: string): string {
    const templatesBase = join(process.cwd(), 'lib', 'templates');
    
    switch (projectType) {
      case 'nextjs':
        return join(templatesBase, 'nextjs-base');
      case 'react':
        return join(templatesBase, 'react-base');
      case 'html':
        return join(templatesBase, 'html-base');
      case 'nodejs':
        return join(templatesBase, 'nodejs-base');
      default:
        return join(templatesBase, 'nextjs-base'); // Default to Next.js
    }
  }

  /**
   * Get file type from path
   */
  private static getFileType(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    
    const typeMap: Record<string, string> = {
      'tsx': 'component',
      'ts': 'typescript',
      'jsx': 'component',
      'js': 'javascript',
      'css': 'style',
      'json': 'config',
      'md': 'documentation',
      'html': 'html',
    };
    
    return typeMap[ext || ''] || 'other';
  }
}
