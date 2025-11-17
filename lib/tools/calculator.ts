
import { type ToolManifest } from '@/db/schema';

/**
 * Calculator Tool
 * Performs mathematical calculations and evaluates expressions
 */
export const calculatorManifest: ToolManifest = {
  key: 'calculator',
  version: '1.0.0',
  description: 'Evaluate mathematical expressions and perform calculations',
  inputSchema: {
    type: 'object',
    required: ['expression'],
    properties: {
      expression: {
        type: 'string',
        description: 'Mathematical expression to evaluate (e.g., "2 + 2 * 3")'
      }
    },
    additionalProperties: false
  },
  outputSchema: {
    type: 'object',
    properties: {
      result: {
        type: 'number',
        description: 'The calculated result'
      },
      expression: {
        type: 'string',
        description: 'The original expression'
      }
    },
    required: ['result', 'expression']
  },
  resources: {
    timeoutSec: 10,
    memMb: 256,
    cpuShares: 128
  },
  container: {
    image: 'mindous/tool-calculator:1.0.0',
    cmd: ['node', 'index.js'],
    argsTemplate: ['--input', '/work/input.json', '--output', '/work/output.json']
  },
  permissions: {
    network: {
      enabled: false
    },
    filesystem: {
      tempDirMb: 64
    }
  }
};

/**
 * Mock calculator implementation for development
 */
export async function executeCalculator(input: { expression: string }) {
  // This is a mock implementation for development
  // In production, this would use a safe math evaluator in a container
  try {
    // Basic safe evaluation (in production, use a proper math parser)
    const sanitized = input.expression.replace(/[^0-9+\-*/().\s]/g, '');
    const result = eval(sanitized);
    
    return {
      result,
      expression: input.expression
    };
  } catch (error) {
    throw new Error(`Failed to evaluate expression: ${error}`);
  }
}
