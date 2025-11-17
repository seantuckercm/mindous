import { spawn, ChildProcess } from 'child_process';
import { db } from '@/db';
import { previewDeploymentsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import net from 'net';

/**
 * Preview Manager Service
 * Manages preview server lifecycle, port allocation, and monitoring
 */

interface PreviewServer {
  process: ChildProcess;
  port: number;
  buildPath: string;
  startTime: number;
  previewId: string;
}

export interface PreviewInfo {
  previewId: string;
  url: string;
  port: number;
  status: 'starting' | 'running' | 'stopped' | 'failed';
}

export class PreviewManager {
  private static activeServers: Map<string, PreviewServer> = new Map();
  private static portRange = { min: 3100, max: 3200 }; // Reserve ports 3100-3200 for previews

  /**
   * Find an available port
   */
  static async findAvailablePort(): Promise<number> {
    for (let port = this.portRange.min; port <= this.portRange.max; port++) {
      if (await this.isPortAvailable(port)) {
        return port;
      }
    }
    throw new Error('No available ports in the range 3100-3200');
  }

  /**
   * Check if a port is available
   */
  private static isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.once('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          resolve(false);
        } else {
          resolve(false);
        }
      });
      
      server.once('listening', () => {
        server.close();
        resolve(true);
      });
      
      server.listen(port);
    });
  }

  /**
   * Start preview server
   */
  static async startPreview(params: {
    previewId: string;
    buildPath: string;
    runId: string;
    buildId: string;
  }): Promise<PreviewInfo> {
    const { previewId, buildPath, runId, buildId } = params;

    console.log(`🚀 Starting preview server for build ${buildId}...`);

    try {
      // Find available port
      const port = await this.findAvailablePort();

      // Update preview deployment record
      await db.update(previewDeploymentsTable)
        .set({ 
          status: 'starting',
          internalPort: port
        })
        .where(eq(previewDeploymentsTable.id, previewId));

      // Start Next.js server
      const process = spawn('npx', ['next', 'start', '-p', port.toString()], {
        cwd: buildPath,
        env: {
          ...process.env,
          NODE_ENV: 'production',
          PORT: port.toString()
        },
        stdio: ['ignore', 'pipe', 'pipe']
      });

      // Store process info
      this.activeServers.set(previewId, {
        process,
        port,
        buildPath,
        startTime: Date.now(),
        previewId
      });

      // Handle process output
      process.stdout?.on('data', (data) => {
        console.log(`[Preview ${previewId}] ${data.toString()}`);
      });

      process.stderr?.on('data', (data) => {
        console.error(`[Preview ${previewId}] ${data.toString()}`);
      });

      // Handle process exit
      process.on('exit', (code) => {
        console.log(`[Preview ${previewId}] Process exited with code ${code}`);
        this.activeServers.delete(previewId);
        
        // Update status in database
        db.update(previewDeploymentsTable)
          .set({ 
            status: 'stopped',
            stoppedAt: new Date()
          })
          .where(eq(previewDeploymentsTable.id, previewId))
          .catch(console.error);
      });

      // Wait for server to be ready
      await this.waitForServerReady(port, 30000); // 30 second timeout

      // Get localhost URL (note: this is the server's localhost, not user's)
      const url = `http://localhost:${port}`;

      // Update status to running
      await db.update(previewDeploymentsTable)
        .set({ 
          status: 'running',
          startedAt: new Date(),
          processId: process.pid?.toString()
        })
        .where(eq(previewDeploymentsTable.id, previewId));

      console.log(`✅ Preview server started at ${url}`);

      return {
        previewId,
        url,
        port,
        status: 'running'
      };

    } catch (error: any) {
      console.error(`❌ Failed to start preview:`, error);

      // Update status to failed
      await db.update(previewDeploymentsTable)
        .set({ 
          status: 'failed',
          stoppedAt: new Date()
        })
        .where(eq(previewDeploymentsTable.id, previewId));

      throw new Error(`Failed to start preview: ${error.message}`);
    }
  }

  /**
   * Wait for server to be ready
   */
  private static async waitForServerReady(port: number, timeoutMs: number): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        // Try to connect to the server
        await new Promise<void>((resolve, reject) => {
          const socket = net.connect(port, 'localhost', () => {
            socket.end();
            resolve();
          });
          
          socket.on('error', reject);
          
          setTimeout(() => reject(new Error('Connection timeout')), 1000);
        });
        
        // Server is ready
        return;
      } catch {
        // Wait 500ms before retry
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    throw new Error(`Server did not start within ${timeoutMs}ms`);
  }

  /**
   * Stop preview server
   */
  static async stopPreview(previewId: string): Promise<void> {
    console.log(`⏹️ Stopping preview ${previewId}...`);

    const server = this.activeServers.get(previewId);
    
    if (server) {
      // Kill the process
      server.process.kill('SIGTERM');
      
      // Give it 5 seconds to gracefully shut down
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Force kill if still running
      if (!server.process.killed) {
        server.process.kill('SIGKILL');
      }
      
      // Remove from active servers
      this.activeServers.delete(previewId);
    }

    // Update database
    await db.update(previewDeploymentsTable)
      .set({ 
        status: 'stopped',
        stoppedAt: new Date()
      })
      .where(eq(previewDeploymentsTable.id, previewId));

    console.log(`✅ Preview ${previewId} stopped`);
  }

  /**
   * Restart preview server
   */
  static async restartPreview(previewId: string): Promise<PreviewInfo> {
    console.log(`🔄 Restarting preview ${previewId}...`);

    // Get preview info from database
    const [preview] = await db
      .select()
      .from(previewDeploymentsTable)
      .where(eq(previewDeploymentsTable.id, previewId));

    if (!preview) {
      throw new Error(`Preview ${previewId} not found`);
    }

    // Stop existing preview
    await this.stopPreview(previewId);

    // Get build path from database
    const buildPath = `/tmp/mindous-builds/${preview.runId}`;

    // Start new preview
    return await this.startPreview({
      previewId,
      buildPath,
      runId: preview.runId,
      buildId: preview.buildId
    });
  }

  /**
   * Get preview info
   */
  static async getPreviewInfo(previewId: string): Promise<PreviewInfo | null> {
    const [preview] = await db
      .select()
      .from(previewDeploymentsTable)
      .where(eq(previewDeploymentsTable.id, previewId));

    if (!preview) {
      return null;
    }

    return {
      previewId: preview.id,
      url: preview.previewUrl,
      port: preview.internalPort,
      status: preview.status
    };
  }

  /**
   * List all active previews
   */
  static getActivePreviewsList(): Array<{ previewId: string; port: number; uptime: number }> {
    return Array.from(this.activeServers.entries()).map(([previewId, server]) => ({
      previewId,
      port: server.port,
      uptime: Date.now() - server.startTime
    }));
  }

  /**
   * Health check for preview
   */
  static async checkPreviewHealth(previewId: string): Promise<boolean> {
    const server = this.activeServers.get(previewId);
    
    if (!server) {
      return false;
    }

    try {
      // Check if port is still listening
      await new Promise<void>((resolve, reject) => {
        const socket = net.connect(server.port, 'localhost', () => {
          socket.end();
          resolve();
        });
        
        socket.on('error', reject);
        
        setTimeout(() => reject(new Error('Connection timeout')), 2000);
      });
      
      // Update last accessed time
      await db.update(previewDeploymentsTable)
        .set({ lastAccessedAt: new Date() })
        .where(eq(previewDeploymentsTable.id, previewId));
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Cleanup inactive previews (not accessed for more than specified hours)
   */
  static async cleanupInactivePreviews(hoursInactive: number = 1): Promise<number> {
    console.log(`🧹 Cleaning up inactive previews (>${hoursInactive}h)...`);

    let cleanedCount = 0;
    const cutoffTime = new Date(Date.now() - hoursInactive * 60 * 60 * 1000);

    // Get all running previews
    const previews = await db
      .select()
      .from(previewDeploymentsTable)
      .where(eq(previewDeploymentsTable.status, 'running'));

    for (const preview of previews) {
      const lastAccessed = preview.lastAccessedAt || preview.startedAt;
      
      if (lastAccessed && lastAccessed < cutoffTime) {
        try {
          await this.stopPreview(preview.id);
          cleanedCount++;
        } catch (error) {
          console.error(`Failed to stop preview ${preview.id}:`, error);
        }
      }
    }

    console.log(`✅ Cleaned up ${cleanedCount} inactive previews`);
    return cleanedCount;
  }

  /**
   * Stop all preview servers (for shutdown)
   */
  static async stopAllPreviews(): Promise<void> {
    console.log('⏹️ Stopping all preview servers...');

    const previewIds = Array.from(this.activeServers.keys());
    
    await Promise.all(
      previewIds.map(previewId => this.stopPreview(previewId).catch(console.error))
    );

    console.log('✅ All preview servers stopped');
  }

  /**
   * Get preview server statistics
   */
  static getStatistics(): {
    activeCount: number;
    totalUptime: number;
    averageUptime: number;
    portUsage: number[];
  } {
    const servers = Array.from(this.activeServers.values());
    const now = Date.now();
    
    const totalUptime = servers.reduce((sum, server) => sum + (now - server.startTime), 0);
    const averageUptime = servers.length > 0 ? totalUptime / servers.length : 0;
    
    return {
      activeCount: servers.length,
      totalUptime,
      averageUptime,
      portUsage: servers.map(s => s.port)
    };
  }
}

// Cleanup task: Run every hour to clean up inactive previews
setInterval(() => {
  PreviewManager.cleanupInactivePreviews(1).catch(console.error);
}, 60 * 60 * 1000); // 1 hour

// Graceful shutdown: Stop all previews on process exit
process.on('SIGINT', () => {
  PreviewManager.stopAllPreviews().then(() => process.exit(0));
});

process.on('SIGTERM', () => {
  PreviewManager.stopAllPreviews().then(() => process.exit(0));
});
