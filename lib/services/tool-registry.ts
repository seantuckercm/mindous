import { db } from '@/db';
import { toolsTable, type InsertTool, type SelectTool, type ToolManifest } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true, strict: false });

/**
 * Tool Registry Service
 * Handles tool registration, discovery, validation, and versioning
 */
export class ToolRegistry {
  /**
   * Register a new tool in the workspace
   */
  static async registerTool(params: {
    workspaceId: string;
    key: string;
    name: string;
    version?: string;
    description?: string;
    manifest: ToolManifest;
    containerImage: string;
    active?: boolean;
  }): Promise<SelectTool> {
    // Validate manifest structure
    this.validateManifest(params.manifest);

    const [tool] = await db.insert(toolsTable).values({
      workspaceId: params.workspaceId,
      key: params.key,
      name: params.name,
      version: params.version || '1.0.0',
      description: params.description,
      manifest: params.manifest,
      containerImage: params.containerImage,
      active: params.active ?? true,
    }).returning();

    return tool;
  }

  /**
   * Get all active tools for a workspace
   */
  static async getActiveTools(workspaceId: string): Promise<SelectTool[]> {
    return db
      .select()
      .from(toolsTable)
      .where(
        and(
          eq(toolsTable.workspaceId, workspaceId),
          eq(toolsTable.active, true)
        )
      );
  }

  /**
   * Get tool by key
   */
  static async getToolByKey(workspaceId: string, key: string): Promise<SelectTool | null> {
    const [tool] = await db
      .select()
      .from(toolsTable)
      .where(
        and(
          eq(toolsTable.workspaceId, workspaceId),
          eq(toolsTable.key, key)
        )
      );

    return tool || null;
  }

  /**
   * Get tool by ID
   */
  static async getToolById(toolId: string): Promise<SelectTool | null> {
    const [tool] = await db
      .select()
      .from(toolsTable)
      .where(eq(toolsTable.id, toolId));

    return tool || null;
  }

  /**
   * Update tool status
   */
  static async updateToolStatus(toolId: string, active: boolean): Promise<SelectTool> {
    const [tool] = await db
      .update(toolsTable)
      .set({ active })
      .where(eq(toolsTable.id, toolId))
      .returning();

    return tool;
  }

  /**
   * Update tool version
   */
  static async updateToolVersion(
    toolId: string,
    version: string,
    manifest: ToolManifest
  ): Promise<SelectTool> {
    this.validateManifest(manifest);

    const [tool] = await db
      .update(toolsTable)
      .set({ version, manifest })
      .where(eq(toolsTable.id, toolId))
      .returning();

    return tool;
  }

  /**
   * Validate tool manifest structure
   */
  static validateManifest(manifest: ToolManifest): void {
    // Check required fields
    if (!manifest.key) throw new Error('Tool manifest must have a key');
    if (!manifest.version) throw new Error('Tool manifest must have a version');
    if (!manifest.inputSchema) throw new Error('Tool manifest must have an inputSchema');
    if (!manifest.outputSchema) throw new Error('Tool manifest must have an outputSchema');
    if (!manifest.resources) throw new Error('Tool manifest must have resources');
    if (!manifest.container) throw new Error('Tool manifest must have container config');

    // Validate timeout
    if (!manifest.resources.timeoutSec || manifest.resources.timeoutSec <= 0) {
      throw new Error('Tool manifest must have a positive timeoutSec');
    }

    // Validate container config
    if (!manifest.container.image) {
      throw new Error('Tool manifest must have a container image');
    }
    if (!manifest.container.cmd || manifest.container.cmd.length === 0) {
      throw new Error('Tool manifest must have container command');
    }

    // Validate schemas are valid JSON Schema
    try {
      ajv.compile(manifest.inputSchema);
    } catch (error) {
      throw new Error(`Invalid inputSchema: ${error}`);
    }

    try {
      ajv.compile(manifest.outputSchema);
    } catch (error) {
      throw new Error(`Invalid outputSchema: ${error}`);
    }
  }

  /**
   * Validate input against tool's input schema
   */
  static validateInput(manifest: ToolManifest, input: any): { valid: boolean; errors?: string } {
    const validate = ajv.compile(manifest.inputSchema);
    const valid = validate(input);

    if (!valid) {
      return {
        valid: false,
        errors: ajv.errorsText(validate.errors)
      };
    }

    return { valid: true };
  }

  /**
   * Validate output against tool's output schema
   */
  static validateOutput(manifest: ToolManifest, output: any): { valid: boolean; errors?: string } {
    const validate = ajv.compile(manifest.outputSchema);
    const valid = validate(output);

    if (!valid) {
      return {
        valid: false,
        errors: ajv.errorsText(validate.errors)
      };
    }

    return { valid: true };
  }

  /**
   * Match tools by capability (find tools that can fulfill a requirement)
   */
  static async matchToolsByCapability(
    workspaceId: string,
    capability: string
  ): Promise<SelectTool[]> {
    const tools = await this.getActiveTools(workspaceId);

    // Simple keyword matching in tool description and key
    return tools.filter(tool => {
      const searchText = `${tool.key} ${tool.name} ${tool.description || ''}`.toLowerCase();
      return searchText.includes(capability.toLowerCase());
    });
  }

  /**
   * Get tool metadata for LLM function calling
   */
  static getToolFunctionSpec(tool: SelectTool): {
    name: string;
    description: string;
    parameters: Record<string, any>;
  } {
    const manifest = tool.manifest as ToolManifest;
    return {
      name: tool.key,
      description: tool.description || tool.name,
      parameters: manifest.inputSchema,
    };
  }

  /**
   * Get all tools as LLM function specs
   */
  static async getLLMFunctionSpecs(workspaceId: string): Promise<Array<{
    name: string;
    description: string;
    parameters: Record<string, any>;
  }>> {
    const tools = await this.getActiveTools(workspaceId);
    return tools.map(tool => this.getToolFunctionSpec(tool));
  }
}
