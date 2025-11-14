'use server';

import { z } from 'zod';
import { routeAndExecute } from '@/lib/llm/router';
import { currentUser } from '@clerk/nextjs/server';

const RouteSchema = z.object({
  subtaskId: z.string().uuid().optional(),
  prompt: z.string().min(1),
  system: z.string().optional(),
  stream: z.boolean().optional(),
  context: z.object({
    taskType: z.enum(['code', 'writing', 'analysis', 'extraction', 'reasoning']).optional(),
    complexity: z.enum(['low', 'medium', 'high']).optional(),
    maxTokens: z.number().int().positive().optional(),
    temperature: z.number().min(0).max(2).optional(),
    allowCache: z.boolean().optional(),
    scope: z.enum(['system', 'tenant', 'user']).optional(),
    ownerId: z.string().optional(),
  }).optional(),
  idempotencyKey: z.string().optional(),
});

export async function routeAndExecuteSubtaskAction(input: unknown) {
  const parsed = RouteSchema.parse(input);
  const user = await currentUser();
  const res = await routeAndExecute({
    ...parsed,
    userId: user?.id,
  });
  return res;
}
