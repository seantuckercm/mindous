
'use server';

import { auth } from '@clerk/nextjs/server';
import { ToolRegistry } from '@/lib/services/tool-registry';
import {
  webSearchManifest,
  calculatorManifest,
  dataProcessorManifest,
  apiCallerManifest
} from '@/lib/tools';

/**
 * Seed default tools for a workspace
 * This should be called when a workspace is created
 */
export async function seedDefaultTools(workspaceId: string) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // TODO: Verify user has admin access to workspace
  
  try {
    const tools = [
      {
        key: webSearchManifest.key,
        name: 'Web Search',
        description: webSearchManifest.description,
        manifest: webSearchManifest,
        containerImage: webSearchManifest.container.image
      },
      {
        key: calculatorManifest.key,
        name: 'Calculator',
        description: calculatorManifest.description,
        manifest: calculatorManifest,
        containerImage: calculatorManifest.container.image
      },
      {
        key: dataProcessorManifest.key,
        name: 'Data Processor',
        description: dataProcessorManifest.description,
        manifest: dataProcessorManifest,
        containerImage: dataProcessorManifest.container.image
      },
      {
        key: apiCallerManifest.key,
        name: 'API Caller',
        description: apiCallerManifest.description,
        manifest: apiCallerManifest,
        containerImage: apiCallerManifest.container.image
      }
    ];

    const seededTools = [];

    for (const toolData of tools) {
      // Check if tool already exists
      const existing = await ToolRegistry.getToolByKey(workspaceId, toolData.key);
      
      if (!existing) {
        const tool = await ToolRegistry.registerTool({
          workspaceId,
          ...toolData
        });
        seededTools.push(tool);
      }
    }

    return { success: true, seededTools };
  } catch (error: any) {
    console.error('Failed to seed tools:', error);
    return { success: false, error: error.message };
  }
}
