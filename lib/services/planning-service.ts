import { routeAndExecute } from '@/lib/llm/router';
import {
  PlanOutputSchema,
  DecomposeTaskInput,
  PlanOutput,
  TaskNode,
} from '@/lib/schemas/planning-schema';
import { RouteContext } from '@/lib/llm/types';

/**
 * Planning Service
 * Responsible for LLM-powered task decomposition and dependency graph generation
 */

const MAX_RETRIES = 2;

/**
 * Generate system prompt for task decomposition
 */
function buildSystemPrompt(): string {
  return `You are an expert AI planning agent specialized in breaking down complex goals into structured, executable plans.

Your role is to:
1. Analyze the user's goal and understand its full scope
2. Break down the goal into a hierarchical task structure
3. Identify dependencies between tasks (what must be done before what)
4. Provide realistic time, cost, and token estimates
5. Create a clear execution strategy

Guidelines for task decomposition:
- Create 5-20 top-level tasks per plan
- Each task should be atomic and take 10-60 seconds to complete
- Break complex tasks into subtasks (children)
- Use clear, actionable task titles (verb + noun)
- Identify hard dependencies (tasks that MUST complete before others)
- Avoid cyclic dependencies
- Be conservative with estimates
- Consider risks and constraints

Task types:
- research: Information gathering, learning
- analysis: Processing data, evaluating options
- action: Execution, building, creating
- review: Quality checks, validation
- deliverable: Final outputs, artifacts
- other: Miscellaneous tasks

Output format requirements:
- Respond ONLY with valid JSON matching the schema
- Use unique IDs for each task (e.g., "task-1", "task-2", "subtask-1-1")
- List dependencies by task ID
- Provide realistic estimates based on task complexity
- Include clear success criteria

IMPORTANT: Your output must be valid JSON that matches the required schema exactly.`;
}

/**
 * Generate user prompt for task decomposition
 */
function buildUserPrompt(input: DecomposeTaskInput): string {
  let prompt = `Please create a detailed execution plan for the following goal:

Goal Title: ${input.goalTitle}
${input.goalDescription ? `Goal Description: ${input.goalDescription}` : ''}
`;

  if (input.context?.taskType) {
    prompt += `\nTask Type: ${input.context.taskType}`;
  }

  if (input.context?.complexity) {
    prompt += `\nComplexity: ${input.context.complexity}`;
  }

  if (input.context?.constraints && input.context.constraints.length > 0) {
    prompt += `\n\nConstraints:`;
    input.context.constraints.forEach((c, i) => {
      prompt += `\n${i + 1}. ${c}`;
    });
  }

  if (input.feedback) {
    prompt += `\n\nUser Feedback for Regeneration:\n${input.feedback}`;
  }

  if (input.previousVersion) {
    prompt += `\n\nNote: This is a regeneration of version ${input.previousVersion}. Please improve based on the feedback provided.`;
  }

  prompt += `\n\nProvide your response as a JSON object with the following structure:
{
  "overview": {
    "objective": "Clear goal statement",
    "assumptions": ["assumption 1", "assumption 2"],
    "constraints": ["constraint 1", "constraint 2"],
    "success_criteria": ["criterion 1", "criterion 2"],
    "overall_strategy": "High-level approach description",
    "risk_notes": ["risk 1", "risk 2"]
  },
  "estimate": {
    "tokens": 10000,
    "usd": 0.15,
    "time_minutes": 30
  },
  "tasks": [
    {
      "id": "task-1",
      "title": "Task title",
      "description": "Detailed description",
      "type": "action",
      "estimate": {
        "tokens": 2000,
        "usd": 0.03,
        "time_minutes": 5
      },
      "expected_artifacts": ["artifact1.txt"],
      "dependencies": [],
      "children": []
    }
  ]
}

Respond ONLY with the JSON object, no additional text.`;

  return prompt;
}

/**
 * Extract JSON from LLM response
 * Handles cases where LLM adds markdown formatting or extra text
 */
function extractJSON(content: string): string {
  // Try to find JSON within markdown code blocks
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Try to find JSON object boundaries
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  // Return as-is if no patterns match
  return content.trim();
}

/**
 * Validate and repair plan output
 * Attempts to fix common issues with LLM output
 */
function validateAndRepair(data: any, attempt: number): { success: boolean; data?: PlanOutput; error?: string } {
  try {
    // First validation attempt
    const parsed = PlanOutputSchema.safeParse(data);
    
    if (parsed.success) {
      return { success: true, data: parsed.data };
    }

    // If first attempt fails and we have retries left, try to repair
    if (attempt < MAX_RETRIES) {
      console.log(`Validation failed on attempt ${attempt}, issues:`, parsed.error.issues);
      
      // Apply basic repairs
      if (data && typeof data === 'object') {
        // Ensure overview exists
        if (!data.overview) {
          data.overview = {
            objective: data.objective || 'Complete the specified goal',
            assumptions: [],
            constraints: [],
            success_criteria: [],
            overall_strategy: '',
            risk_notes: [],
          };
        }

        // Ensure estimate exists
        if (!data.estimate) {
          data.estimate = { tokens: 0, usd: 0, time_minutes: 0 };
        }

        // Ensure tasks is an array
        if (!Array.isArray(data.tasks)) {
          data.tasks = [];
        }

        // Try parsing again after repairs
        const repairedParse = PlanOutputSchema.safeParse(data);
        if (repairedParse.success) {
          return { success: true, data: repairedParse.data };
        }
      }

      return { 
        success: false, 
        error: `Validation failed: ${parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}` 
      };
    }

    return { 
      success: false, 
      error: `Failed to validate after ${attempt} attempts` 
    };
  } catch (err: any) {
    return { 
      success: false, 
      error: `Validation error: ${err.message}` 
    };
  }
}

/**
 * Detect cycles in dependency graph
 * Returns true if a cycle is detected
 */
function hasCyclicDependencies(tasks: TaskNode[]): boolean {
  const taskMap = new Map<string, TaskNode>();
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  // Flatten all tasks including children
  function flattenTasks(taskList: TaskNode[]) {
    for (const task of taskList) {
      taskMap.set(task.id, task);
      if (task.children && task.children.length > 0) {
        flattenTasks(task.children as TaskNode[]);
      }
    }
  }

  flattenTasks(tasks);

  function hasCycle(taskId: string): boolean {
    if (!visited.has(taskId)) {
      visited.add(taskId);
      recursionStack.add(taskId);

      const task = taskMap.get(taskId);
      if (task && task.dependencies) {
        for (const depId of task.dependencies) {
          if (!visited.has(depId) && hasCycle(depId)) {
            return true;
          } else if (recursionStack.has(depId)) {
            return true;
          }
        }
      }
    }

    recursionStack.delete(taskId);
    return false;
  }

  for (const taskId of taskMap.keys()) {
    if (hasCycle(taskId)) {
      return true;
    }
  }

  return false;
}

/**
 * Main task decomposition function
 * Uses LLM routing to select best model and generate plan
 */
export async function decomposeTask(input: DecomposeTaskInput, userId?: string): Promise<PlanOutput> {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(input);

  // Determine routing context based on input
  const routeContext: RouteContext = {
    taskType: input.context?.taskType || 'analysis',
    complexity: input.context?.complexity || 'medium',
    maxTokens: 4000,
    temperature: 0.2,
    allowCache: false, // Don't cache planning requests
    scope: 'user',
    ownerId: userId || null,
  };

  let lastError: string | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Task decomposition attempt ${attempt}/${MAX_RETRIES}`);

      // Call LLM via router
      const response = await routeAndExecute({
        prompt: userPrompt,
        system: systemPrompt,
        context: routeContext,
        userId,
      });

      console.log(`LLM response from ${response.provider}/${response.model}`);

      // Extract JSON from response
      const jsonStr = extractJSON(response.content);
      
      let parsedData: any;
      try {
        parsedData = JSON.parse(jsonStr);
      } catch (parseErr: any) {
        console.error('JSON parse error:', parseErr.message);
        lastError = `Invalid JSON: ${parseErr.message}`;
        continue;
      }

      // Validate and repair
      const validation = validateAndRepair(parsedData, attempt);
      
      if (!validation.success) {
        lastError = validation.error;
        console.error(`Validation failed on attempt ${attempt}:`, validation.error);
        continue;
      }

      // Check for cyclic dependencies
      if (hasCyclicDependencies(validation.data!.tasks)) {
        lastError = 'Cyclic dependencies detected in plan';
        console.error('Cyclic dependencies detected, retrying...');
        continue;
      }

      console.log('Task decomposition successful');
      return validation.data!;
    } catch (err: any) {
      lastError = err.message || 'Unknown error';
      console.error(`Attempt ${attempt} failed:`, err);
      
      // Wait before retrying
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw new Error(`Task decomposition failed after ${MAX_RETRIES} attempts. Last error: ${lastError}`);
}

/**
 * Calculate total estimates by aggregating all tasks and subtasks
 */
export function aggregateEstimates(tasks: TaskNode[]): {
  tokens: number;
  usd: number;
  time_minutes: number;
} {
  let totalTokens = 0;
  let totalUsd = 0;
  let totalTime = 0;

  function processTask(task: TaskNode) {
    totalTokens += task.estimate?.tokens || 0;
    totalUsd += task.estimate?.usd || 0;
    totalTime += task.estimate?.time_minutes || 0;

    if (task.children && task.children.length > 0) {
      (task.children as TaskNode[]).forEach(processTask);
    }
  }

  tasks.forEach(processTask);

  return {
    tokens: totalTokens,
    usd: Math.round(totalUsd * 100) / 100, // Round to 2 decimals
    time_minutes: totalTime,
  };
}

/**
 * Flatten hierarchical tasks for database storage
 * Returns flat array with parent-child relationships preserved
 */
export function flattenTaskTree(tasks: TaskNode[]): Array<{
  node: TaskNode;
  parentId: string | null;
  level: number;
  orderIndex: number;
}> {
  const flattened: Array<{
    node: TaskNode;
    parentId: string | null;
    level: number;
    orderIndex: number;
  }> = [];

  function walk(taskList: TaskNode[], parentId: string | null, level: number) {
    taskList.forEach((task, index) => {
      flattened.push({
        node: task,
        parentId,
        level,
        orderIndex: index,
      });

      if (task.children && task.children.length > 0) {
        walk(task.children as TaskNode[], task.id, level + 1);
      }
    });
  }

  walk(tasks, null, 0);
  return flattened;
}
