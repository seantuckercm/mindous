
import { type ToolManifest } from '@/db/schema';
import { generateCode, CodeGenerationRequest } from '@/lib/services/code-generator';

/**
 * Code Generation Tool
 * Generates code using LLM based on specifications
 */
export const codeGenerationManifest: ToolManifest = {
  key: 'code_generation',
  version: '1.0.0',
  description: 'Generate code using AI based on natural language specifications',
  inputSchema: {
    type: 'object',
    required: ['prompt', 'type', 'language'],
    properties: {
      prompt: {
        type: 'string',
        description: 'Natural language description of what code to generate'
      },
      type: {
        type: 'string',
        enum: ['component', 'page', 'api', 'utility', 'config', 'style'],
        description: 'Type of code to generate'
      },
      language: {
        type: 'string',
        enum: ['typescript', 'javascript', 'css', 'json', 'html'],
        description: 'Programming language for the code'
      },
      framework: {
        type: 'string',
        enum: ['react', 'nextjs', 'vue', 'svelte'],
        description: 'Framework to use (optional)'
      },
      context: {
        type: 'object',
        properties: {
          dependencies: {
            type: 'array',
            items: { type: 'string' },
            description: 'Available dependencies'
          },
          existingFiles: {
            type: 'array',
            items: { type: 'string' },
            description: 'Existing files in the project'
          },
          projectStructure: {
            type: 'string',
            description: 'Project structure information'
          },
          additionalInstructions: {
            type: 'string',
            description: 'Additional instructions for code generation'
          }
        }
      }
    },
    additionalProperties: false
  },
  outputSchema: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'Generated code'
      },
      language: {
        type: 'string',
        description: 'Language of the generated code'
      },
      framework: {
        type: 'string',
        description: 'Framework used (if applicable)'
      },
      fileName: {
        type: 'string',
        description: 'Suggested file name'
      },
      provider: {
        type: 'string',
        description: 'LLM provider used'
      },
      model: {
        type: 'string',
        description: 'LLM model used'
      }
    },
    required: ['code', 'language']
  },
  resources: {
    timeoutSec: 60,
    memMb: 512,
    cpuShares: 256
  },
  container: {
    image: 'mindous/tool-code-generation:1.0.0',
    cmd: ['node', 'index.js'],
    argsTemplate: ['--input', '/work/input.json', '--output', '/work/output.json']
  },
  permissions: {
    network: {
      enabled: true
    },
    filesystem: {
      tempDirMb: 128
    }
  }
};

/**
 * Execute code generation tool
 */
export async function executeCodeGeneration(input: CodeGenerationRequest) {
  return await generateCode(input);
}
