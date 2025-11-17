
/**
 * Test script for File Operations Tool
 */

import { executeFileOperation } from '@/lib/tools/file-operations';
import { join } from 'path';
import { tmpdir } from 'os';

async function testFileOperations() {
  console.log('📁 Testing File Operations Tool...\n');

  const testDir = join(tmpdir(), 'mindous-test-files');

  try {
    // Test 1: Create directory
    console.log('Test 1: Create directory');
    await executeFileOperation({
      operation: 'mkdir',
      path: 'test-project',
      projectPath: testDir
    });
    console.log('✅ Directory created');
    console.log();

    // Test 2: Create file
    console.log('Test 2: Create file');
    await executeFileOperation({
      operation: 'create',
      path: 'test-project/index.ts',
      projectPath: testDir,
      content: `
export function hello(name: string): string {
  return \`Hello, \${name}!\`;
}

export function add(a: number, b: number): number {
  return a + b;
}
      `.trim()
    });
    console.log('✅ File created');
    console.log();

    // Test 3: Read file
    console.log('Test 3: Read file');
    const readResult = await executeFileOperation({
      operation: 'read',
      path: 'test-project/index.ts',
      projectPath: testDir
    });
    console.log('✅ File read successfully');
    console.log('Content length:', readResult.content?.length);
    console.log();

    // Test 4: Get file metadata
    console.log('Test 4: Get file metadata');
    const metadataResult = await executeFileOperation({
      operation: 'metadata',
      path: 'test-project/index.ts',
      projectPath: testDir
    });
    console.log('✅ Metadata retrieved');
    console.log('File size:', metadataResult.metadata.size, 'bytes');
    console.log('Modified:', metadataResult.metadata.modified);
    console.log();

    // Test 5: Create multiple files for search test
    console.log('Test 5: Create multiple files');
    await executeFileOperation({
      operation: 'create',
      path: 'test-project/utils.ts',
      projectPath: testDir,
      content: `
export function multiply(a: number, b: number): number {
  return a * b;
}
      `.trim()
    });
    console.log('✅ Additional file created');
    console.log();

    // Test 6: List files
    console.log('Test 6: List files in directory');
    const listResult = await executeFileOperation({
      operation: 'list',
      path: 'test-project',
      projectPath: testDir
    });
    console.log('✅ Files listed');
    console.log('Files found:', listResult.files.length);
    console.log('Files:', listResult.files.map((f: any) => f.name));
    console.log();

    // Test 7: Search in files
    console.log('Test 7: Search for pattern in files');
    const searchResult = await executeFileOperation({
      operation: 'search',
      path: 'test-project',
      projectPath: testDir,
      pattern: 'function.*number',
      maxDepth: 3
    });
    console.log('✅ Search completed');
    console.log('Matches found:', searchResult.matches.length);
    if (searchResult.matches.length > 0) {
      console.log('First match:', searchResult.matches[0].match);
    }
    console.log();

    // Test 8: Directory tree
    console.log('Test 8: Get directory tree');
    const treeResult = await executeFileOperation({
      operation: 'tree',
      path: 'test-project',
      projectPath: testDir,
      maxDepth: 3
    });
    console.log('✅ Tree generated');
    console.log('Tree nodes:', treeResult.tree.length);
    console.log();

    // Test 9: Update file
    console.log('Test 9: Update file');
    await executeFileOperation({
      operation: 'update',
      path: 'test-project/index.ts',
      projectPath: testDir,
      content: 'export const VERSION = "1.0.0";'
    });
    console.log('✅ File updated');
    console.log();

    // Test 10: Delete file
    console.log('Test 10: Delete file');
    await executeFileOperation({
      operation: 'delete',
      path: 'test-project/utils.ts',
      projectPath: testDir
    });
    console.log('✅ File deleted');
    console.log();

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testFileOperations().then(() => {
  console.log('✅ All File Operations tests completed!');
  process.exit(0);
});
