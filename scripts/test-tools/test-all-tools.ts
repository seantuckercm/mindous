
/**
 * Run all tool tests
 */

import { spawn } from 'child_process';
import { join } from 'path';

const tests = [
  'test-web-search.ts',
  'test-code-execution.ts',
  'test-file-operations.ts',
  'test-api-integration.ts',
  'test-browser-automation.ts'
];

async function runTest(testFile: string): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running: ${testFile}`);
    console.log('='.repeat(60));

    const child = spawn('tsx', [join(__dirname, testFile)], {
      stdio: 'inherit',
      shell: true
    });

    child.on('exit', (code) => {
      resolve(code === 0);
    });

    child.on('error', (error) => {
      console.error('Failed to start test:', error);
      resolve(false);
    });
  });
}

async function runAllTests() {
  console.log('🚀 Running all tool tests...\n');

  const results: Record<string, boolean> = {};
  
  for (const test of tests) {
    const success = await runTest(test);
    results[test] = success;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('Test Summary');
  console.log('='.repeat(60));

  let allPassed = true;
  for (const [test, success] of Object.entries(results)) {
    console.log(`${success ? '✅' : '❌'} ${test}`);
    if (!success) allPassed = false;
  }

  console.log('='.repeat(60));
  console.log(allPassed ? '✅ All tests passed!' : '❌ Some tests failed');
  
  process.exit(allPassed ? 0 : 1);
}

runAllTests();
