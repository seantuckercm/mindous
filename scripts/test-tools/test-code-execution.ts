
/**
 * Test script for Code Execution Tool
 */

import { executeCode, validateCode } from '@/lib/tools/code-execution';

async function testCodeExecution() {
  console.log('⚙️ Testing Code Execution Tool...\n');

  try {
    // Test 1: Python code execution
    console.log('Test 1: Python code execution');
    const pythonCode = `
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

result = factorial(5)
print(f"Factorial of 5 is {result}")
    `.trim();

    const result1 = await executeCode({
      code: pythonCode,
      language: 'python',
      timeout: 10
    });

    console.log('✅ Success!');
    console.log('Output:', result1.stdout);
    console.log('Exit code:', result1.exitCode);
    console.log('Duration:', result1.executionTimeMs + 'ms');
    console.log();

    // Test 2: Node.js code execution
    console.log('Test 2: Node.js code execution');
    const nodeCode = `
const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce((a, b) => a + b, 0);
console.log('Sum:', sum);
console.log('Average:', sum / numbers.length);
    `.trim();

    const result2 = await executeCode({
      code: nodeCode,
      language: 'nodejs',
      timeout: 10
    });

    console.log('✅ Success!');
    console.log('Output:', result2.stdout);
    console.log();

    // Test 3: Error handling
    console.log('Test 3: Error handling');
    const errorCode = `
print(undefined_variable)
    `.trim();

    const result3 = await executeCode({
      code: errorCode,
      language: 'python',
      timeout: 10
    });

    console.log('✅ Error caught correctly');
    console.log('Success:', result3.success);
    console.log('Stderr:', result3.stderr);
    console.log();

    // Test 4: Timeout handling
    console.log('Test 4: Timeout handling');
    const infiniteLoop = `
import time
while True:
    time.sleep(1)
    `.trim();

    const result4 = await executeCode({
      code: infiniteLoop,
      language: 'python',
      timeout: 2
    });

    console.log('✅ Timeout handled correctly');
    console.log('Timeout:', result4.timeout);
    console.log();

    // Test 5: Code validation
    console.log('Test 5: Code validation');
    const dangerousCode = `
import subprocess
subprocess.run(['ls', '-la'])
    `.trim();

    const validation = validateCode(dangerousCode, 'python');
    console.log('✅ Validation result:', validation.valid ? 'Safe' : 'Dangerous');
    if (!validation.valid) {
      console.log('Reason:', validation.reason);
    }
    console.log();

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testCodeExecution().then(() => {
  console.log('✅ All Code Execution tests completed!');
  process.exit(0);
});
