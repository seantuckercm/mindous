import { routeAndExecute } from '@/lib/llm/router';
import { RouteContext } from '@/lib/llm/types';

/**
 * Code Generator Service
 * LLM-powered code generation for agent tasks
 */

export interface CodeGenerationRequest {
  prompt: string;
  type: 'component' | 'page' | 'api' | 'utility' | 'config' | 'style';
  framework?: 'react' | 'nextjs' | 'vue' | 'svelte';
  language: 'typescript' | 'javascript' | 'css' | 'json' | 'html';
  context?: {
    dependencies?: string[];
    existingFiles?: string[];
    projectStructure?: string;
    additionalInstructions?: string;
  };
  userId?: string;
  subtaskId?: string;
}

export interface CodeGenerationResult {
  code: string;
  language: string;
  framework?: string;
  fileName?: string;
  explanation?: string;
  provider: string;
  model: string;
  tokensUsed?: number;
}

/**
 * System prompt for code generation
 */
function getCodeGenerationSystemPrompt(request: CodeGenerationRequest): string {
  const { type, framework, language } = request;

  let basePrompt = `You are an expert software engineer specializing in ${language} development`;
  
  if (framework) {
    basePrompt += ` with ${framework}`;
  }

  basePrompt += `.

Your task is to generate high-quality, production-ready code based on the user's requirements.

Code Generation Guidelines:
- Write clean, readable, and well-documented code
- Follow best practices and coding standards for ${language}`;

  if (framework) {
    basePrompt += ` and ${framework}`;
  }

  basePrompt += `
- Include proper error handling
- Add TypeScript types when using TypeScript
- Use modern syntax and features
- Include helpful comments for complex logic
- Ensure code is secure and performant
- Follow the DRY (Don't Repeat Yourself) principle
- Make code maintainable and testable

Component Type: ${type}
Language: ${language}`;

  if (framework) {
    basePrompt += `\nFramework: ${framework}`;
  }

  basePrompt += `

Output Format:
- Provide ONLY the code, no explanations or markdown formatting
- Do NOT wrap the code in markdown code blocks (\`\`\`)
- Include necessary imports at the top
- Add inline comments where helpful
- Ensure proper indentation`;

  return basePrompt;
}

/**
 * Build user prompt with context
 */
function buildCodeGenerationPrompt(request: CodeGenerationRequest): string {
  let prompt = request.prompt;

  if (request.context) {
    const { dependencies, existingFiles, projectStructure, additionalInstructions } = request.context;

    if (projectStructure) {
      prompt += `\n\nProject Structure:\n${projectStructure}`;
    }

    if (existingFiles && existingFiles.length > 0) {
      prompt += `\n\nExisting Files:\n${existingFiles.join('\n')}`;
    }

    if (dependencies && dependencies.length > 0) {
      prompt += `\n\nAvailable Dependencies:\n${dependencies.join('\n')}`;
    }

    if (additionalInstructions) {
      prompt += `\n\nAdditional Instructions:\n${additionalInstructions}`;
    }
  }

  return prompt;
}

/**
 * Extract code from LLM response
 * Handles cases where LLM adds markdown formatting
 */
function extractCode(content: string): string {
  // Remove markdown code blocks if present
  const codeBlockMatch = content.match(/```(?:\w+)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Return as-is if no code blocks found
  return content.trim();
}

/**
 * Suggest file name based on code content
 */
function suggestFileName(code: string, type: string, language: string): string {
  // Try to extract component/function name from code
  const componentMatch = code.match(/(?:export\s+(?:default\s+)?(?:function|const|class)\s+)(\w+)/);
  const fileName = componentMatch ? componentMatch[1] : type;

  // Determine extension
  let ext = language === 'typescript' ? 'ts' : language === 'javascript' ? 'js' : language;
  
  if (type === 'component' && (language === 'typescript' || language === 'javascript')) {
    ext = language === 'typescript' ? 'tsx' : 'jsx';
  }

  // Convert to kebab-case
  const kebabName = fileName
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();

  return `${kebabName}.${ext}`;
}

/**
 * Generate code using LLM
 */
export async function generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResult> {
  const systemPrompt = getCodeGenerationSystemPrompt(request);
  const userPrompt = buildCodeGenerationPrompt(request);

  // Determine routing context based on complexity
  const routeContext: RouteContext = {
    taskType: 'code',
    complexity: 'medium',
    maxTokens: 4000,
    temperature: 0.2,
    allowCache: false, // Don't cache code generation
    scope: 'user',
    ownerId: request.userId || null,
  };

  console.log(`🔨 Generating ${request.type} code in ${request.language}`);

  const startTime = Date.now();
  const response = await routeAndExecute({
    prompt: userPrompt,
    system: systemPrompt,
    context: routeContext,
    userId: request.userId,
    subtaskId: request.subtaskId,
  });

  const generationTime = Date.now() - startTime;
  console.log(`✅ Code generated in ${generationTime}ms using ${response.provider}/${response.model}`);

  const code = extractCode(response.content);
  const fileName = suggestFileName(code, request.type, request.language);

  return {
    code,
    language: request.language,
    framework: request.framework,
    fileName,
    provider: response.provider,
    model: response.model,
    tokensUsed: response.tokensOutput,
  };
}

/**
 * Generate multiple related code files
 */
export async function generateMultipleFiles(
  requests: CodeGenerationRequest[]
): Promise<CodeGenerationResult[]> {
  console.log(`🔨 Generating ${requests.length} code files`);

  const results: CodeGenerationResult[] = [];

  for (const request of requests) {
    const result = await generateCode(request);
    results.push(result);
  }

  console.log(`✅ Generated ${results.length} files successfully`);
  return results;
}

/**
 * Generate Next.js component
 */
export async function generateNextJSComponent(params: {
  componentName: string;
  description: string;
  props?: string[];
  styling?: 'tailwind' | 'css-modules' | 'styled-components';
  userId?: string;
  subtaskId?: string;
}): Promise<CodeGenerationResult> {
  const { componentName, description, props = [], styling = 'tailwind', userId, subtaskId } = params;

  let prompt = `Create a Next.js React component named "${componentName}".

Description: ${description}`;

  if (props.length > 0) {
    prompt += `\n\nProps:\n${props.map(p => `- ${p}`).join('\n')}`;
  }

  prompt += `\n\nStyling: Use ${styling}`;

  return generateCode({
    prompt,
    type: 'component',
    framework: 'nextjs',
    language: 'typescript',
    userId,
    subtaskId,
  });
}

/**
 * Generate API route
 */
export async function generateAPIRoute(params: {
  routeName: string;
  description: string;
  methods: ('GET' | 'POST' | 'PUT' | 'DELETE')[];
  authentication?: boolean;
  userId?: string;
  subtaskId?: string;
}): Promise<CodeGenerationResult> {
  const { routeName, description, methods, authentication = false, userId, subtaskId } = params;

  let prompt = `Create a Next.js API route for "${routeName}".

Description: ${description}

Supported Methods: ${methods.join(', ')}`;

  if (authentication) {
    prompt += `\n\nRequirements:
- Add authentication using Clerk (@clerk/nextjs/server)
- Protect the route with auth() from Clerk
- Return 401 for unauthorized requests`;
  }

  prompt += `\n\nFollow Next.js 14+ App Router conventions for API routes.`;

  return generateCode({
    prompt,
    type: 'api',
    framework: 'nextjs',
    language: 'typescript',
    userId,
    subtaskId,
  });
}

/**
 * Generate task breakdown for a project using Abacus AI
 */
export async function generateTaskBreakdown(params: {
  projectDescription: string;
  userId?: string;
}): Promise<string> {
  const { projectDescription, userId } = params;

  const systemPrompt = `You are an AI project planner. Break down software projects into clear, actionable tasks.

Guidelines:
- Create a hierarchical task structure
- Each task should be specific and measurable
- Include estimates for time and complexity
- Identify dependencies between tasks
- Consider technical requirements
- Think about testing and deployment`;

  const userPrompt = `Break down this project into tasks:

${projectDescription}

Provide a structured breakdown with:
1. High-level phases
2. Specific tasks for each phase
3. Dependencies
4. Estimated complexity (low/medium/high)`;

  const response = await routeAndExecute({
    prompt: userPrompt,
    system: systemPrompt,
    context: {
      taskType: 'analysis',
      complexity: 'medium',
      maxTokens: 2000,
      temperature: 0.3,
    },
    userId,
  });

  return response.content;
}
