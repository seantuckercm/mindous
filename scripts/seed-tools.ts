/**
 * Seed Script for Default Tools
 * Run this to populate the database with default tools
 */
import { db } from '@/db';
import { toolsTable } from '@/db/schema';
import {
  webSearchManifest,
  calculatorManifest,
  dataProcessorManifest,
  apiCallerManifest
} from '@/lib/tools';

const DEFAULT_WORKSPACE_ID = '00000000-0000-0000-0000-000000000000';

async function seedTools() {
  console.log('Seeding default tools...');

  const tools = [
    {
      workspaceId: DEFAULT_WORKSPACE_ID,
      key: webSearchManifest.key,
      name: 'Web Search',
      description: webSearchManifest.description,
      manifest: webSearchManifest,
      containerImage: webSearchManifest.container.image,
      active: true
    },
    {
      workspaceId: DEFAULT_WORKSPACE_ID,
      key: calculatorManifest.key,
      name: 'Calculator',
      description: calculatorManifest.description,
      manifest: calculatorManifest,
      containerImage: calculatorManifest.container.image,
      active: true
    },
    {
      workspaceId: DEFAULT_WORKSPACE_ID,
      key: dataProcessorManifest.key,
      name: 'Data Processor',
      description: dataProcessorManifest.description,
      manifest: dataProcessorManifest,
      containerImage: dataProcessorManifest.container.image,
      active: true
    },
    {
      workspaceId: DEFAULT_WORKSPACE_ID,
      key: apiCallerManifest.key,
      name: 'API Caller',
      description: apiCallerManifest.description,
      manifest: apiCallerManifest,
      containerImage: apiCallerManifest.container.image,
      active: true
    }
  ];

  try {
    for (const tool of tools) {
      console.log(`Seeding tool: ${tool.name}`);
      await db.insert(toolsTable).values(tool).onConflictDoNothing();
    }

    console.log('✅ Tools seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding tools:', error);
    throw error;
  }
}

// Run the seed function
seedTools()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
