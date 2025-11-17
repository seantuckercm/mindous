import { z } from 'zod';

/**
 * Task node schema for recursive task decomposition
 * Supports hierarchical task breakdown with dependencies and estimates
 */
export const TaskNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string().min(1).describe('Unique identifier for this task (used for dependency mapping)'),
    title: z.string().min(1).max(200).describe('Short, actionable task title'),
    description: z.string().optional().default('').describe('Detailed description of the task'),
    type: z
      .enum(['research', 'analysis', 'action', 'review', 'deliverable', 'other'])
      .default('other')
      .describe('Type of task for categorization'),
    estimate: z
      .object({
        tokens: z.number().int().nonnegative().default(0).describe('Estimated tokens for LLM calls'),
        usd: z.number().nonnegative().default(0).describe('Estimated cost in USD'),
        time_minutes: z.number().int().nonnegative().default(0).describe('Estimated time in minutes'),
      })
      .default({ tokens: 0, usd: 0, time_minutes: 0 }),
    expected_artifacts: z
      .array(z.string())
      .default([])
      .describe('List of expected outputs/deliverables'),
    dependencies: z
      .array(z.string())
      .default([])
      .describe('List of task IDs this task depends on'),
    children: z.array(z.any()).default([]).describe('Nested subtasks'),
  })
);

/**
 * Complete plan output schema
 * Includes overview, estimates, and hierarchical task breakdown
 */
export const PlanOutputSchema = z.object({
  overview: z.object({
    objective: z.string().min(1).describe('Clear statement of the goal'),
    assumptions: z.array(z.string()).default([]).describe('Assumptions made in planning'),
    constraints: z.array(z.string()).default([]).describe('Known limitations or constraints'),
    success_criteria: z
      .array(z.string())
      .default([])
      .describe('Measurable criteria for success'),
    overall_strategy: z.string().default('').describe('High-level approach to achieve the goal'),
    risk_notes: z
      .array(z.string())
      .default([])
      .optional()
      .describe('Potential risks or concerns'),
  }),
  estimate: z
    .object({
      tokens: z.number().int().nonnegative().default(0),
      usd: z.number().nonnegative().default(0),
      time_minutes: z.number().int().nonnegative().default(0),
    })
    .default({ tokens: 0, usd: 0, time_minutes: 0 }),
  tasks: z.array(TaskNodeSchema).describe('Top-level tasks in the plan'),
});

export type TaskNode = z.infer<typeof TaskNodeSchema>;
export type PlanOutput = z.infer<typeof PlanOutputSchema>;

/**
 * Input schema for task decomposition requests
 */
export const DecomposeTaskInputSchema = z.object({
  goalTitle: z.string().min(1).max(500),
  goalDescription: z.string().optional(),
  context: z
    .object({
      taskType: z.enum(['code', 'writing', 'analysis', 'extraction', 'reasoning']).optional(),
      complexity: z.enum(['low', 'medium', 'high']).optional(),
      constraints: z.array(z.string()).optional(),
      preferences: z.record(z.string()).optional(),
    })
    .optional(),
  feedback: z.string().optional().describe('User feedback for regeneration'),
  previousVersion: z.number().int().positive().optional().describe('Previous version number if regenerating'),
});

export type DecomposeTaskInput = z.infer<typeof DecomposeTaskInputSchema>;
