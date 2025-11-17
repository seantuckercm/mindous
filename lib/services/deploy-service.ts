import { db } from '@/db';
import { previewDeploymentsTable, buildsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { PreviewManager, PreviewInfo } from './preview-manager';
import { EventPublisher } from './event-publisher';

/**
 * Deploy Service
 * Handles preview deployment and URL generation
 */

export interface DeploymentParams {
  buildId: string;
  runId: string;
  buildPath: string;
}

export interface DeploymentInfo {
  previewId: string;
  previewUrl: string;
  port: number;
  status: 'starting' | 'running' | 'stopped' | 'failed';
  buildId: string;
  runId: string;
}

export class DeployService {
  /**
   * Deploy build to preview environment
   */
  static async deployPreview(params: DeploymentParams): Promise<DeploymentInfo> {
    const { buildId, runId, buildPath } = params;

    console.log(`🚀 Deploying preview for build ${buildId}...`);

    try {
      // Verify build exists and is completed
      const [build] = await db
        .select()
        .from(buildsTable)
        .where(eq(buildsTable.id, buildId));

      if (!build) {
        throw new Error(`Build ${buildId} not found`);
      }

      if (build.status !== 'completed') {
        throw new Error(`Build ${buildId} is not completed (status: ${build.status})`);
      }

      // Create preview deployment record
      const [preview] = await db.insert(previewDeploymentsTable).values({
        runId,
        buildId,
        previewUrl: '', // Will be set after port allocation
        internalPort: 0, // Will be set after port allocation
        status: 'starting'
      }).returning();

      // Publish preview starting event
      await EventPublisher.publishEvent({
        runId,
        eventType: 'PREVIEW_STARTING',
        message: 'Starting preview deployment...',
        data: { previewId: preview.id, buildId }
      });

      // Start preview server
      const previewInfo = await PreviewManager.startPreview({
        previewId: preview.id,
        buildPath,
        runId,
        buildId
      });

      // Update preview URL in database
      await db.update(previewDeploymentsTable)
        .set({ 
          previewUrl: previewInfo.url
        })
        .where(eq(previewDeploymentsTable.id, preview.id));

      // Publish preview ready event
      await EventPublisher.publishPreviewReady(runId, {
        previewId: preview.id,
        url: previewInfo.url,
        port: previewInfo.port
      });

      console.log(`✅ Preview deployed successfully: ${previewInfo.url}`);

      return {
        previewId: preview.id,
        previewUrl: previewInfo.url,
        port: previewInfo.port,
        status: previewInfo.status,
        buildId,
        runId
      };

    } catch (error: any) {
      console.error(`❌ Failed to deploy preview:`, error);

      // Publish preview failed event
      await EventPublisher.publishPreviewFailed(runId, {
        error: error.message
      });

      throw new Error(`Preview deployment failed: ${error.message}`);
    }
  }

  /**
   * Get deployment info
   */
  static async getDeploymentInfo(previewId: string): Promise<DeploymentInfo | null> {
    const [preview] = await db
      .select()
      .from(previewDeploymentsTable)
      .where(eq(previewDeploymentsTable.id, previewId));

    if (!preview) {
      return null;
    }

    return {
      previewId: preview.id,
      previewUrl: preview.previewUrl,
      port: preview.internalPort,
      status: preview.status,
      buildId: preview.buildId,
      runId: preview.runId
    };
  }

  /**
   * Stop deployment
   */
  static async stopDeployment(previewId: string): Promise<void> {
    console.log(`⏹️ Stopping deployment ${previewId}...`);

    const preview = await this.getDeploymentInfo(previewId);
    
    if (!preview) {
      throw new Error(`Preview ${previewId} not found`);
    }

    // Stop preview server
    await PreviewManager.stopPreview(previewId);

    console.log(`✅ Deployment stopped: ${previewId}`);
  }

  /**
   * Restart deployment
   */
  static async restartDeployment(previewId: string): Promise<DeploymentInfo> {
    console.log(`🔄 Restarting deployment ${previewId}...`);

    const preview = await this.getDeploymentInfo(previewId);
    
    if (!preview) {
      throw new Error(`Preview ${previewId} not found`);
    }

    // Restart preview server
    const previewInfo = await PreviewManager.restartPreview(previewId);

    // Update preview URL
    await db.update(previewDeploymentsTable)
      .set({ 
        previewUrl: previewInfo.url,
        status: previewInfo.status
      })
      .where(eq(previewDeploymentsTable.id, previewId));

    console.log(`✅ Deployment restarted: ${previewInfo.url}`);

    return {
      ...preview,
      previewUrl: previewInfo.url,
      port: previewInfo.port,
      status: previewInfo.status
    };
  }

  /**
   * Get deployment logs (if available)
   */
  static async getDeploymentLogs(previewId: string): Promise<string> {
    // For now, return a placeholder
    // In production, you might capture and store logs
    const preview = await this.getDeploymentInfo(previewId);
    
    if (!preview) {
      throw new Error(`Preview ${previewId} not found`);
    }

    return `Preview deployment logs for ${previewId}\n` +
           `Status: ${preview.status}\n` +
           `URL: ${preview.previewUrl}\n` +
           `Port: ${preview.port}\n`;
  }

  /**
   * List all deployments for a run
   */
  static async listDeployments(runId: string): Promise<DeploymentInfo[]> {
    const previews = await db
      .select()
      .from(previewDeploymentsTable)
      .where(eq(previewDeploymentsTable.runId, runId));

    return previews.map(preview => ({
      previewId: preview.id,
      previewUrl: preview.previewUrl,
      port: preview.internalPort,
      status: preview.status,
      buildId: preview.buildId,
      runId: preview.runId
    }));
  }

  /**
   * Get active deployment for a build (if any)
   */
  static async getActiveDeploymentForBuild(buildId: string): Promise<DeploymentInfo | null> {
    const [preview] = await db
      .select()
      .from(previewDeploymentsTable)
      .where(eq(previewDeploymentsTable.buildId, buildId));

    if (!preview || preview.status === 'stopped' || preview.status === 'failed') {
      return null;
    }

    return {
      previewId: preview.id,
      previewUrl: preview.previewUrl,
      port: preview.internalPort,
      status: preview.status,
      buildId: preview.buildId,
      runId: preview.runId
    };
  }

  /**
   * Health check for deployment
   */
  static async checkDeploymentHealth(previewId: string): Promise<boolean> {
    return await PreviewManager.checkPreviewHealth(previewId);
  }

  /**
   * Get deployment statistics
   */
  static async getDeploymentStatistics(): Promise<{
    totalDeployments: number;
    activeDeployments: number;
    stoppedDeployments: number;
    failedDeployments: number;
  }> {
    const allPreviews = await db.select().from(previewDeploymentsTable);

    return {
      totalDeployments: allPreviews.length,
      activeDeployments: allPreviews.filter(p => p.status === 'running').length,
      stoppedDeployments: allPreviews.filter(p => p.status === 'stopped').length,
      failedDeployments: allPreviews.filter(p => p.status === 'failed').length
    };
  }
}
