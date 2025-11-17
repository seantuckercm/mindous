
import { z } from 'zod';

// Task estimation schema
export const TaskEstimateSchema = z.object({
  tokens: z.number().int().nonnegative().default(0),
  usd: z.number().nonnegative().default(0),
  time_minutes: z.number().int().nonnegative().default(0),
});

// Task node schema (recursive for subtasks)
export const TaskNodeSchema: z.ZodType<TaskNode> = z.lazy(() => z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().optional().default(''),
  type: z.enum(['research', 'analysis', 'action', 'review', 'deliverable', 'other']).default('other'),
  estimate: TaskEstimateSchema.optional(),
  expected_artifacts: z.array(z.string()).default([]),
  dependencies: z.array(z.string()).default([]),
  children: z.array(TaskNodeSchema).default([]),
}));

// Plan overview schema
export const PlanOverviewSchema = z.object({
  objective: z.string().min(1),
  assumptions: z.array(z.string()).default([]),
  constraints: z.array(z.string()).default([]),
  success_criteria: z.array(z.string()).default([]),
  overall_strategy: z.string().default(''),
  risk_notes: z.array(z.string()).default([]),
});

// Complete plan output schema
export const PlanOutputSchema = z.object({
  overview: PlanOverviewSchema,
  estimate: TaskEstimateSchema.optional(),
  tasks: z.array(TaskNodeSchema),
});

// Task decomposition input schema
export const DecomposeTaskInputSchema = z.object({
  goalTitle: z.string().min(1),
  goalDescription: z.string().optional(),
  context: z.object({
    taskType: z.enum(['research', 'analysis', 'action', 'review', 'deliverable', 'other']).optional(),
    complexity: z.enum(['low', 'medium', 'high']).optional(),
  }).optional(),
  feedback: z.string().optional(),
  previousVersion: z.number().optional(),
});

// Type exports
export type TaskEstimate = z.infer<typeof TaskEstimateSchema>;
export type TaskNode = {
  id: string;
  title: string;
  description?: string;
  type: 'research' | 'analysis' | 'action' | 'review' | 'deliverable' | 'other';
  estimate?: TaskEstimate;
  expected_artifacts: string[];
  dependencies: string[];
  children: TaskNode[];
};
export type PlanOverview = z.infer<typeof PlanOverviewSchema>;
export type PlanOutput = z.infer<typeof PlanOutputSchema>;
export type DecomposeTaskInput = z.infer<typeof DecomposeTaskInputSchema>;
