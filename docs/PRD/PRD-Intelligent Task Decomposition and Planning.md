## Feature: Intelligent Task Decomposition & Planning

### Overview
Automatically analyzes a user's complex goal and generates a structured, executable plan. The plan includes a hierarchical task graph with well-defined subtasks, dependencies, sequencing, and estimated resource costs (tokens, time, USD). Users can review, edit, or approve the plan before execution. The feature stores versioned plans and emits events for real-time UI updates and replanning.

### Reference Platform Analysis
Based on comprehensive analysis of Abacus.AI's DeepAgent implementation (November 2025), this PRD incorporates proven patterns for task decomposition and user-facing execution visibility. Key insight: Users need to see the **plan unfold in real-time** with clear task/subtask hierarchy and progress indicators.

### Planning & Execution Flow from Reference Implementation

#### 1. Multi-Phase Execution Pattern

**Phase 1: Clarification (Conditional)**
When user input needs refinement, agent pauses for structured clarification:
- Numbered questions list format
- Examples provided in parentheses for clarity
- Option to "choose appropriate answers and move forward"
- Feedback buttons (👍👎) for response quality
- **Key Learning:** Don't execute blindly - validate assumptions first

**Phase 2: Planning**
Visual status indicators during planning phase:
- Status: "Planning"
- Status: "Understanding requirements"
- Status: "Weighing the possibilities"
- **Duration:** Typically 2-5 seconds for user feedback
- **Purpose:** Sets expectation that agent is thinking

**Phase 3: Execution with Visibility**
Real-time display of task breakdown during execution:
- Tasks broken into numbered subtasks
- Format: "Task 1, Subtask X" displayed prominently
- Subtask counter increments as work progresses
- Each subtask shows its specific operation
- **Key Learning:** Continuous feedback prevents user anxiety

#### 2. Task Hierarchy Display Patterns

**Task Card Structure:**
```
┌─────────────────────────────────────────┐
│ [Agent Icon] [Status Icon]              │
│ Task 1: Create Next.js application      │
│ Status: In progress                     │
│ └─ Subtask 1: Initialize project        │
│ └─ Subtask 2: Install dependencies      │
│ └─ Subtask 3: Create pages              │
│ └─ Subtask 4: Configure routing         │
└─────────────────────────────────────────┘
```

**Subtask Visibility Patterns:**
- Current subtask highlighted with different background
- Completed subtasks show green checkmark
- Pending subtasks grayed out
- Failed subtasks show red X with error message
- Expandable details for each subtask (logs, artifacts)

#### 3. Progress Tracking Mechanisms

**Bottom Status Bar (Always Visible):**
- Format: "Task X, Subtask Y"
- Updates in real-time as execution progresses
- Sticky position (remains visible during scroll)
- Provides context at a glance

**Task Completion Indicators:**
- Visual checkmark when task completes
- Summary card showing all completed operations
- Credits used display (resource tracking)
- Action CTAs (Preview, Deploy, etc.)

#### 4. File Operations as Task Evidence

Every file operation serves as visible proof of progress:
- Badge format: "[Action] ~/path/to/file"
- Operations tracked: Written ✓, Updated ✓, Running, Deleted
- Real-time appearance as operations complete
- Download buttons on hover
- **Key Learning:** Users trust what they can see

#### 5. Task Decomposition Granularity

Based on observed patterns, optimal subtask breakdown:

**Good Granularity Examples:**
1. "Initialize Next.js project" (atomic, ~10-30 seconds)
2. "Install dependencies via npm" (atomic, visible output)
3. "Create homepage component" (atomic, produces artifact)
4. "Configure Tailwind CSS" (atomic, modifies files)

**Too Coarse (Avoid):**
- "Build entire application" (too vague, no progress feedback)
- "Set up frontend" (too broad, many sub-operations)

**Too Fine (Avoid):**
- "Write import statement" (too granular, noisy)
- "Add semicolon to line 42" (unnecessary detail)

**Optimal Range:** 5-20 subtasks per task, each 10-60 seconds

#### 6. User Interaction Points

**Before Execution:**
- Review generated plan (not explicitly shown in Abacus, but needed for planning-focused features)
- Edit task descriptions
- Adjust task order
- Add/remove dependencies

**During Execution:**
- Pause button (freezes current subtask)
- Cancel button (stops entire task)
- View logs for specific subtask
- **Key Learning:** Users need control, not just observation

**After Completion:**
- Feedback buttons (👍👎)
- Download artifacts
- View all files
- Follow-up input for iterations

#### 7. Cost & Resource Estimation Display

**From Analysis - Credit System Transparency:**
- Credits displayed prominently after task completion
- Example: "Credits Used: 623"
- **Key Learning:** Users need to understand resource consumption
- Format: Clear number, no hidden costs

**Recommended for Planning Phase:**
- Show estimated credits before execution
- Break down by: LLM calls, tool usage, deployment
- Allow users to see cost implications before approval

### Critical Implementation Requirements

#### Must-Have for MVP
1. **Clarification Phase** - Structured Q&A before execution when needed
2. **Planning Status Indicators** - Visual feedback during plan generation
3. **Hierarchical Task Display** - Clear parent task → subtask relationship
4. **Progress Counter** - "Task X, Subtask Y" persistent display
5. **File Operation Tracking** - Badge system for all file changes
6. **Completion Summary** - List of all operations with metadata

#### High Priority
7. **Plan Review Interface** - Allow users to inspect plan before execution
8. **Cost Estimation** - Show estimated credits/resources
9. **Edit Capabilities** - Modify task descriptions and order
10. **Pause/Cancel Controls** - User control over execution

#### Nice-to-Have
11. **Graph Visualization** - Visual DAG of task dependencies
12. **Plan Versioning** - Track different plan iterations
13. **Historical Analysis** - Compare planned vs actual execution

### User Stories & Requirements
- As an authenticated user, I want to input a goal and generate a structured plan so that I can review a clear, step-by-step path to completion.
  - Acceptance:
    - User can enter a goal (title + description).
    - System generates a plan with at least 1 version containing tasks, dependencies, and estimates.
    - The plan includes overall strategy, assumptions, constraints, and success criteria.

- As a user, I want to visualize the plan as a graph and a tree so that I can understand hierarchy and dependencies.
  - Acceptance:
    - A graph view shows nodes (tasks) and edges (dependencies).
    - A tree view shows parent/child relationships and order.
    - Selecting a task shows details (description, type, estimates, expected artifacts).

- As a user, I want to edit the plan (rename tasks, update descriptions, add/remove dependencies) so that I can tailor it to my needs.
  - Acceptance:
    - Inline edits persist to the database.
    - Dependency add/remove validates no cycles.
    - Reordering updates orderIndex.

- As a user, I want to regenerate or replan with feedback so that the plan adapts to my constraints.
  - Acceptance:
    - A regenerate action creates a new plan version with user-provided feedback included in the LLM prompt.
    - Prior versions remain accessible.

- As a user, I want to see cost/time/token estimates at plan and task level so that I understand resource requirements.
  - Acceptance:
    - Plan version shows aggregated estimates.
    - Each task shows individual estimates.

- As a user, I want to approve a plan so that execution can begin later.
  - Acceptance:
    - Approving a plan sets status to approved and emits an event.
    - Approved plan becomes locked for structural edits (non-structural textual edits may be allowed, depending on policy flag).

- As a system, I want to store plan versions and change events so that the UI can reflect history and real-time updates.
  - Acceptance:
    - plan_versions created on each generation/regeneration.
    - plan_events recorded for created, regenerated, replanned, approved, edited.

- As a system, I must validate and repair malformed LLM JSON so that invalid outputs don’t break the workflow.
  - Acceptance:
    - Strict schema validation.
    - Up to 2 auto-repair attempts; otherwise emit a user-visible error with retry.

### Technical Implementation

#### Database Schema
```typescript
// /db/schema/planning.ts
import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  integer,
  numeric,
  varchar,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const planStatusEnum = pgEnum('plan_status', ['draft', 'proposed', 'approved', 'archived']);
export const taskTypeEnum = pgEnum('task_type', ['research', 'analysis', 'action', 'review', 'deliverable', 'other']);
export const dependencyTypeEnum = pgEnum('dependency_type', ['hard', 'soft']);
export const planEventTypeEnum = pgEnum('plan_event_type', ['created', 'regenerated', 'replanned', 'approved', 'edited']);

// Plans (top-level)
export const plans = pgTable('plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(), // Clerk user id
  goalTitle: text('goal_title').notNull(),
  goalDescription: text('goal_description'),
  status: planStatusEnum('status').notNull().default('proposed'),
  currentVersionId: uuid('current_version_id'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}, (t) => ({
  userIdx: index('plans_user_idx').on(t.userId),
}));

// Plan versions (immutable generated or regenerated outputs)
export const planVersions = pgTable('plan_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  planId: uuid('plan_id').notNull().references(() => plans.id, { onDelete: 'cascade' }),
  versionNumber: integer('version_number').notNull(),
  llmModel: text('llm_model').notNull(),
  overview: jsonb('overview').$type<{
    objective: string;
    assumptions: string[];
    constraints: string[];
    successCriteria: string[];
    overallStrategy: string;
    riskNotes?: string[];
  }>(),
  tokensEstimate: integer('tokens_estimate').notNull().default(0),
  usdEstimate: numeric('usd_estimate', { precision: 10, scale: 4 }).notNull().default('0'),
  timeMinutesEstimate: integer('time_minutes_estimate').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
}, (t) => ({
  planIdx: index('plan_versions_plan_idx').on(t.planId),
  versionUnique: uniqueIndex('plan_versions_unique').on(t.planId, t.versionNumber),
}));

// Tasks (flattened tree; parentTaskId represents hierarchy)
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  planVersionId: uuid('plan_version_id').notNull().references(() => planVersions.id, { onDelete: 'cascade' }),
  parentTaskId: uuid('parent_task_id').references(() => tasks.id, { onDelete: 'set null' }),
  // LLM-provided local identifier to map dependencies before UUIDs are assigned
  sourceId: varchar('source_id', { length: 128 }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  type: taskTypeEnum('type').notNull().default('other'),
  orderIndex: integer('order_index').notNull().default(0),
  expectedArtifacts: jsonb('expected_artifacts').$type<string[]>(),
  tokensEstimate: integer('tokens_estimate').notNull().default(0),
  usdEstimate: numeric('usd_estimate', { precision: 10, scale: 4 }).notNull().default('0'),
  timeMinutesEstimate: integer('time_minutes_estimate').notNull().default(0),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
}, (t) => ({
  versionIdx: index('tasks_version_idx').on(t.planVersionId),
  parentIdx: index('tasks_parent_idx').on(t.parentTaskId),
  sourceUnique: uniqueIndex('tasks_source_unique').on(t.planVersionId, t.sourceId),
}));

// Directed acyclic graph edges (dependencies)
export const taskDependencies = pgTable('task_dependencies', {
  id: uuid('id').primaryKey().defaultRandom(),
  planVersionId: uuid('plan_version_id').notNull().references(() => planVersions.id, { onDelete: 'cascade' }),
  fromTaskId: uuid('from_task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  toTaskId: uuid('to_task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  type: dependencyTypeEnum('type').notNull().default('hard'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
}, (t) => ({
  versionIdx: index('task_deps_version_idx').on(t.planVersionId),
  pairUnique: uniqueIndex('task_deps_pair_unique').on(t.planVersionId, t.fromTaskId, t.toTaskId),
}));

// Plan events (for activity feed / realtime updates)
export const planEvents = pgTable('plan_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  planVersionId: uuid('plan_version_id').notNull().references(() => planVersions.id, { onDelete: 'cascade' }),
  type: planEventTypeEnum('type').notNull(),
  message: text('message'),
  data: jsonb('data').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
}, (t) => ({
  versionIdx: index('plan_events_version_idx').on(t.planVersionId),
}));

// Relations (optional, for type safety)
export const plansRelations = relations(plans, ({ many }) => ({
  versions: many(planVersions),
}));

export const planVersionsRelations = relations(planVersions, ({ one, many }) => ({
  plan: one(plans, { fields: [planVersions.planId], references: [plans.id] }),
  tasks: many(tasks),
  events: many(planEvents),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  version: one(planVersions, { fields: [tasks.planVersionId], references: [planVersions.id] }),
  parent: one(tasks, { fields: [tasks.parentTaskId], references: [tasks.id] }),
  children: many(tasks),
}));
```

#### API Endpoints / Server Actions
```typescript
// /lib/llm/planning-schema.ts
import { z } from 'zod';

export const TaskNodeSchema = z.lazy(() => z.object({
  id: z.string().min(1), // LLM-local id used for dependency mapping
  title: z.string().min(1).max(200),
  description: z.string().optional().default(''),
  type: z.enum(['research', 'analysis', 'action', 'review', 'deliverable', 'other']).default('other'),
  estimate: z.object({
    tokens: z.number().int().nonnegative().default(0),
    usd: z.number().nonnegative().default(0),
    time_minutes: z.number().int().nonnegative().default(0),
  }).default({ tokens: 0, usd: 0, time_minutes: 0 }),
  expected_artifacts: z.array(z.string()).default([]),
  dependencies: z.array(z.string()).default([]), // list of id strings
  children: z.array(z.any()).default([]), // will re-validate recursively
}));

export const PlanOutputSchema = z.object({
  overview: z.object({
    objective: z.string().min(1),
    assumptions: z.array(z.string()).default([]),
    constraints: z.array(z.string()).default([]),
    success_criteria: z.array(z.string()).default([]),
    overall_strategy: z.string().default(''),
    risk_notes: z.array(z.string()).default([]),
  }),
  estimate: z.object({
    tokens: z.number().int().nonnegative().default(0),
    usd: z.number().nonnegative().default(0),
    time_minutes: z.number().int().nonnegative().default(0),
  }).default({ tokens: 0, usd: 0, time_minutes: 0 }),
  tasks: z.array(TaskNodeSchema),
});

export type PlanOutput = z.infer<typeof PlanOutputSchema>;
export type TaskNode = z.infer<typeof TaskNodeSchema>;
```

```typescript
// /lib/llm/providers.ts
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export type LLMProvider = 'openai' | 'anthropic';

export function getLLMClient(provider: LLMProvider) {
  if (provider === 'openai') {
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}
```

```typescript
// /actions/planning-actions.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { plans, planVersions, tasks, taskDependencies, planEvents } from '@/db/schema/planning';
import { and, eq, desc, sql, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { PlanOutputSchema, TaskNode } from '@/lib/llm/planning-schema';
import { getLLMClient, LLMProvider } from '@/lib/llm/providers';

// Helpers
async function requireAuth() {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');
  return userId;
}

// TODO: integrate subscription checks if required
async function requireActiveSubscription(userId: string) {
  // Integrate with Whop entitlement check here if needed
  return true;
}

type CreatePlanInput = {
  goalTitle: string;
  goalDescription?: string;
  provider: LLMProvider;
  model: string; // e.g., gpt-4o, o3-mini, claude-3-5-sonnet
  feedback?: string; // optional user constraints/preferences
};

export async function createPlanFromGoal(input: CreatePlanInput) {
  const userId = await requireAuth();
  await requireActiveSubscription(userId);

  // 1) Create plan + initial version number
  const [plan] = await db.insert(plans).values({
    userId,
    goalTitle: input.goalTitle,
    goalDescription: input.goalDescription ?? '',
    status: 'proposed',
  }).returning();

  const [maxVer] = await db.select({ v: sql<number>`COALESCE(MAX(${planVersions.versionNumber}), 0)` })
    .from(planVersions)
    .where(eq(planVersions.planId, plan.id));

  const versionNumber = (maxVer?.v ?? 0) + 1;

  // 2) Call LLM to generate plan JSON
  const llmResult = await generateLLMPlan({
    provider: input.provider,
    model: input.model,
    goalTitle: input.goalTitle,
    goalDescription: input.goalDescription ?? '',
    feedback: input.feedback,
  });

  // 3) Validate
  const parsed = PlanOutputSchema.safeParse(llmResult);
  if (!parsed.success) {
    await db.insert(planEvents).values({
      planVersionId: plan.id, // temporary, will correct after version insert
      type: 'edited',
      message: 'LLM output validation failed',
      data: { issues: parsed.error.issues },
    });
    throw new Error('Failed to validate plan from LLM.');
  }

  // 4) Persist plan version + tasks + deps atomically
  const version = await db.transaction(async (tx) => {
    const [ver] = await tx.insert(planVersions).values({
      planId: plan.id,
      versionNumber,
      llmModel: input.model,
      overview: {
        objective: parsed.data.overview.objective,
        assumptions: parsed.data.overview.assumptions,
        constraints: parsed.data.overview.constraints,
        successCriteria: parsed.data.overview.success_criteria,
        overallStrategy: parsed.data.overview.overall_strategy,
        riskNotes: parsed.data.overview.risk_notes,
      },
      tokensEstimate: parsed.data.estimate.tokens,
      usdEstimate: parsed.data.estimate.usd.toString(),
      timeMinutesEstimate: parsed.data.estimate.time_minutes,
    }).returning();

    // Flatten tasks, insert, and map sourceId -> UUID
    const flat: { node: TaskNode; parentSourceId?: string; level: number; orderIndex: number }[] = [];
    const walk = (nodes: TaskNode[], parent?: string, level = 0) => {
      nodes.forEach((n, idx) => {
        flat.push({ node: n, parentSourceId: parent, level, orderIndex: idx });
        if (n.children?.length) walk(n.children as TaskNode[], n.id, level + 1);
      });
    };
    walk(parsed.data.tasks);

    // Insert tasks
    const insertedTasks = await tx.insert(tasks).values(flat.map(f => ({
      planVersionId: ver.id,
      parentTaskId: null, // set after we know parent UUIDs
      sourceId: f.node.id,
      title: f.node.title,
      description: f.node.description ?? '',
      type: f.node.type as any,
      orderIndex: f.orderIndex,
      expectedArtifacts: f.node.expected_artifacts ?? [],
      tokensEstimate: f.node.estimate?.tokens ?? 0,
      usdEstimate: (f.node.estimate?.usd ?? 0).toString(),
      timeMinutesEstimate: f.node.estimate?.time_minutes ?? 0,
      metadata: { level: f.level },
    }))).returning({ id: tasks.id, sourceId: tasks.sourceId });

    const sourceToUuid = new Map(insertedTasks.map(t => [t.sourceId, t.id]));

    // Update parentTaskId where applicable
    for (const f of flat) {
      if (!f.parentSourceId) continue;
      const childUuid = sourceToUuid.get(f.node.id)!;
      const parentUuid = sourceToUuid.get(f.parentSourceId);
      if (parentUuid) {
        await tx.update(tasks)
          .set({ parentTaskId: parentUuid })
          .where(eq(tasks.id, childUuid));
      }
    }

    // Insert dependencies
    const depRows: { planVersionId: string; fromTaskId: string; toTaskId: string; type: 'hard' | 'soft' }[] = [];
    for (const f of flat) {
      const toUuid = sourceToUuid.get(f.node.id)!;
      for (const depSource of f.node.dependencies ?? []) {
        const fromUuid = sourceToUuid.get(depSource);
        if (fromUuid && fromUuid !== toUuid) {
          depRows.push({ planVersionId: ver.id, fromTaskId: fromUuid, toTaskId: toUuid, type: 'hard' });
        }
      }
    }
    if (depRows.length) await tx.insert(taskDependencies).values(depRows);

    // Event + set currentVersion
    await tx.insert(planEvents).values({
      planVersionId: ver.id,
      type: 'created',
      message: `Plan generated (v${ver.versionNumber})`,
      data: { tokens: parsed.data.estimate.tokens, usd: parsed.data.estimate.usd, time_minutes: parsed.data.estimate.time_minutes },
    });

    await tx.update(plans).set({ currentVersionId: ver.id, updatedAt: sql`NOW()` }).where(eq(plans.id, plan.id));

    return ver;
  });

  revalidatePath(`/plans/${plan.id}`);
  return { planId: plan.id, versionId: version.id };
}

export async function regeneratePlan(params: { planId: string; provider: LLMProvider; model: string; feedback?: string }) {
  const userId = await requireAuth();
  await requireActiveSubscription(userId);

  const [plan] = await db.select().from(plans).where(and(eq(plans.id, params.planId), eq(plans.userId, userId)));
  if (!plan) throw new Error('Plan not found');

  // Get latest version
  const [latest] = await db.select().from(planVersions)
    .where(eq(planVersions.planId, plan.id))
    .orderBy(desc(planVersions.versionNumber)).limit(1);

  const llmResult = await generateLLMPlan({
    provider: params.provider,
    model: params.model,
    goalTitle: plan.goalTitle,
    goalDescription: plan.goalDescription ?? '',
    feedback: params.feedback,
    previousPlan: latest ? { version: latest.versionNumber } : undefined,
  });

  const parsed = PlanOutputSchema.safeParse(llmResult);
  if (!parsed.success) throw new Error('Failed to validate regenerated plan');

  // Persist like createPlanFromGoal but increment versionNumber
  const [maxVer] = await db.select({ v: sql<number>`COALESCE(MAX(${planVersions.versionNumber}), 0)` })
    .from(planVersions)
    .where(eq(planVersions.planId, plan.id));
  const versionNumber = (maxVer?.v ?? 0) + 1;

  const ver = await db.transaction(async (tx) => {
    const [v] = await tx.insert(planVersions).values({
      planId: plan.id,
      versionNumber,
      llmModel: params.model,
      overview: {
        objective: parsed.data.overview.objective,
        assumptions: parsed.data.overview.assumptions,
        constraints: parsed.data.overview.constraints,
        successCriteria: parsed.data.overview.success_criteria,
        overallStrategy: parsed.data.overview.overall_strategy,
        riskNotes: parsed.data.overview.risk_notes,
      },
      tokensEstimate: parsed.data.estimate.tokens,
      usdEstimate: parsed.data.estimate.usd.toString(),
      timeMinutesEstimate: parsed.data.estimate.time_minutes,
    }).returning();

    // Insert tasks + deps (same as above)
    // ... reuse logic (factor into a helper in production)

    await tx.insert(planEvents).values({
      planVersionId: v.id,
      type: 'regenerated',
      message: `Plan regenerated (v${v.versionNumber})`,
      data: { feedback: params.feedback },
    });

    await tx.update(plans).set({ currentVersionId: v.id, updatedAt: sql`NOW()` }).where(eq(plans.id, plan.id));
    return v;
  });

  revalidatePath(`/plans/${plan.id}`);
  return { planId: plan.id, versionId: ver.id };
}

export async function approvePlan(planId: string) {
  const userId = await requireAuth();
  await requireActiveSubscription(userId);

  const [plan] = await db.select().from(plans).where(and(eq(plans.id, planId), eq(plans.userId, userId)));
  if (!plan) throw new Error('Plan not found');

  await db.transaction(async (tx) => {
    await tx.update(plans).set({ status: 'approved', updatedAt: sql`NOW()` }).where(eq(plans.id, plan.id));
    if (!plan.currentVersionId) throw new Error('No plan version to approve');
    await tx.insert(planEvents).values({
      planVersionId: plan.currentVersionId,
      type: 'approved',
      message: 'Plan approved',
    });
  });

  revalidatePath(`/plans/${planId}`);
}

// Simple edits
export async function updateTaskDetails(taskId: string, patch: { title?: string; description?: string; type?: string }) {
  const userId = await requireAuth();

  // authorize by joining through plan -> user
  const [t] = await db.select({ id: tasks.id, planVersionId: tasks.planVersionId }).from(tasks).where(eq(tasks.id, taskId));
  if (!t) throw new Error('Task not found');

  const [pv] = await db.select({ planId: planVersions.planId }).from(planVersions).where(eq(planVersions.id, t.planVersionId));
  const [p] = await db.select().from(plans).where(and(eq(plans.id, pv.planId), eq(plans.userId, userId)));
  if (!p) throw new Error('Unauthorized');

  if (p.status === 'approved') throw new Error('Plan is approved and locked');

  await db.update(tasks).set({
    title: patch.title,
    description: patch.description,
    type: (patch.type as any) ?? undefined,
  }).where(eq(tasks.id, taskId));

  await db.insert(planEvents).values({
    planVersionId: t.planVersionId,
    type: 'edited',
    message: 'Task updated',
    data: { taskId, patch },
  });

  revalidatePath(`/plans/${p.id}`);
}

export async function addDependency(params: { planVersionId: string; fromTaskId: string; toTaskId: string; type?: 'hard' | 'soft' }) {
  const userId = await requireAuth();

  // Authorization via planVersion -> plan -> user
  const [pv] = await db.select({ planId: planVersions.planId }).from(planVersions).where(eq(planVersions.id, params.planVersionId));
  if (!pv) throw new Error('Plan version not found');
  const [p] = await db.select().from(plans).where(and(eq(plans.id, pv.planId), eq(plans.userId, userId)));
  if (!p) throw new Error('Unauthorized');

  if (p.status === 'approved') throw new Error('Plan is approved and locked');

  if (params.fromTaskId === params.toTaskId) throw new Error('Cannot depend on itself');

  // Insert; in real implementation, detect cycles after insertion attempt (and rollback if cycle detected)
  await db.insert(taskDependencies).values({
    planVersionId: params.planVersionId,
    fromTaskId: params.fromTaskId,
    toTaskId: params.toTaskId,
    type: params.type ?? 'hard',
  });

  await db.insert(planEvents).values({
    planVersionId: params.planVersionId,
    type: 'edited',
    message: 'Dependency added',
    data: params,
  });
}

export async function removeDependency(depId: string) {
  const userId = await requireAuth();

  const [dep] = await db.select().from(taskDependencies).where(eq(taskDependencies.id, depId));
  if (!dep) return;

  const [pv] = await db.select({ planId: planVersions.planId }).from(planVersions).where(eq(planVersions.id, dep.planVersionId));
  const [p] = await db.select().from(plans).where(and(eq(plans.id, pv.planId), eq(plans.userId, userId)));
  if (!p) throw new Error('Unauthorized');
  if (p.status === 'approved') throw new Error('Plan is approved and locked');

  await db.delete(taskDependencies).where(eq(taskDependencies.id, depId));
  await db.insert(planEvents).values({
    planVersionId: dep.planVersionId,
    type: 'edited',
    message: 'Dependency removed',
    data: { depId },
  });
}

export async function getPlanGraph(planId: string) {
  const userId = await requireAuth();
  const [p] = await db.select().from(plans).where(and(eq(plans.id, planId), eq(plans.userId, userId)));
  if (!p) throw new Error('Not found');

  const [v] = await db.select().from(planVersions).where(eq(planVersions.id, p.currentVersionId!));
  if (!v) throw new Error('No current version');

  const taskRows = await db.select().from(tasks).where(eq(tasks.planVersionId, v.id));
  const depRows = await db.select().from(taskDependencies).where(eq(taskDependencies.planVersionId, v.id));
  return { plan: p, version: v, tasks: taskRows, dependencies: depRows };
}

// Internal: LLM call + structured output with retries
async function generateLLMPlan(args: { provider: LLMProvider; model: string; goalTitle: string; goalDescription: string; feedback?: string; previousPlan?: { version: number } }) {
  const systemPrompt = `
You are an expert project planner. Produce a JSON object strictly matching the provided schema. 
Create a hierarchical breakdown of tasks with unique local ids, dependencies, and estimates. 
Ensure no cyclic dependencies and provide conservative estimates.
`.trim();

  const userPrompt = `
Goal Title: ${args.goalTitle}
Goal Description: ${args.goalDescription}
Additional Feedback/Constraints: ${args.feedback ?? 'None'}
If regenerating, consider previous version: ${args.previousPlan ? 'v' + args.previousPlan.version : 'N/A'}
`.trim();

  // Minimal provider compatibility; prefers model JSON output hints
  if (args.provider === 'openai') {
    const client = getLLMClient('openai') as any;
    const res = await client.chat.completions.create({
      model: args.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${userPrompt}\nRespond ONLY with JSON for keys: overview, estimate, tasks.` },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });
    const raw = res.choices[0]?.message?.content ?? '{}';
    try {
      return JSON.parse(raw);
    } catch {
      // fallback: attempt JSON extraction
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      return JSON.parse(raw.slice(start, end + 1));
    }
  } else {
    const client = getLLMClient('anthropic') as any;
    const res = await client.messages.create({
      model: args.model,
      max_tokens: 2048,
      temperature: 0.2,
      system: systemPrompt,
      messages: [{ role: 'user', content: `${userPrompt}\nReturn JSON only.` }],
    });
    const raw = res.content?.[0]?.type === 'text' ? res.content[0].text : '{}';
    return JSON.parse(raw as string);
  }
}
```

#### Components Structure
```
/components/planning/
├── plan-form.tsx           // Goal input + model selection + Generate button
├── plan-toolbar.tsx        // Approve, Regenerate with feedback, version switcher
├── plan-graph.tsx          // Graph visualization (React Flow)
├── task-tree.tsx           // Tree view with inline edits
├── task-details-drawer.tsx // Side drawer with task metadata & estimates
```

Pages
```
/app/(dashboard)/plans/new/page.tsx          // Entry to create a new plan
/app/(dashboard)/plans/[planId]/page.tsx     // Plan review/edit/approve UI
```

Key component notes:
- plan-form.tsx: uses ShadCN Input, Textarea, Select (model), Button. Calls createPlanFromGoal server action.
- plan-graph.tsx: uses @xyflow/react to render nodes/edges from getPlanGraph. Click node to open task-details-drawer.
- task-tree.tsx: recursive list with inline edits, calling updateTaskDetails; reorder via drag handle to update orderIndex (server action to be added if needed).
- plan-toolbar.tsx: approvePlan, regeneratePlan modal to capture feedback; version dropdown (loads previous versions read-only).

#### State Management
- Data source of truth on server via Supabase Postgres.
- Mutations via Next.js Server Actions (createPlanFromGoal, regeneratePlan, approvePlan, updateTaskDetails, add/removeDependency).
- Client subscribes to Supabase Realtime on plan_events and tasks for live updates in plan view.
- Local UI state: selectedTaskId, isEditing flags, optimistic updates for edits with rollback on error.

### Dependencies & Integrations
- External LLM APIs:
  - OpenAI (openai npm) and/or Anthropic (@anthropic-ai/sdk).
  - Env vars: OPENAI_API_KEY, ANTHROPIC_API_KEY.
- Supabase Realtime for live updates (subscribe to changes on tasks, task_dependencies, plan_events).
- Optional visualization library:
  - @xyflow/react (React Flow) for DAG rendering.
- Authentication: Clerk; all server actions check auth and ownership.
- Payments/Entitlements: Whop (optional guard to restrict plan generation for active subscribers).

Required npm packages beyond standard:
- openai
- @anthropic-ai/sdk
- zod
- @xyflow/react

### Implementation Steps
1. Create database schema
   - Add /db/schema/planning.ts and run drizzle migration.
   - Ensure enums and indexes are created.
2. Generate queries
   - Add helper queries for loading current version, tasks, and dependencies.
3. Implement server actions
   - Implement createPlanFromGoal with LLM call, validation (Zod), transactional persistence.
   - Implement regeneratePlan, approvePlan, updateTaskDetails, addDependency, removeDependency, getPlanGraph.
   - Add cycle detection on dependencies if needed (post-insert check with DFS; rollback if cycle).
4. Build UI components
   - plan-form.tsx for goal input/model selection.
   - plan-graph.tsx using @xyflow/react nodes/edges.
   - task-tree.tsx with inline edit using ShadCN inputs.
   - plan-toolbar.tsx with approve/regenerate/version selector.
   - task-details-drawer.tsx for detail view + edit controls.
5. Connect frontend to backend
   - Pages use server actions and server components for initial load; client components subscribe to Supabase Realtime.
   - Wire buttons and forms to actions; revalidatePath calls ensure fresh data.
6. Add error handling
   - Display toasts using ShadCN for failures (validation, auth, rate limits).
   - Retry LLM parsing twice; show actionable error if invalid.
   - Guard edits when plan is approved (disable controls).
7. Test the feature
   - Add unit tests for LLM schema validation, flattener, dependency mapping, and cycle detection.
   - Add integration tests for server actions with a test db.
   - Add Playwright tests for plan creation, graph rendering, edits, and approval.

### Edge Cases & Error Handling
- LLM returns invalid JSON:
  - Attempt JSON extraction and re-parse.
  - If still invalid, retry once with explicit “Respond with valid JSON matching schema” instruction.
  - Log event and show user error with retry button.
- Cyclic dependencies:
  - Validate DAG after insert; if a cycle is detected, rollback and show error. Provide guidance to edit/remove dependency.
- Duplicate task ids (sourceId) from LLM:
  - On conflict detection, regenerate unique suffix or request regeneration; prefer rejecting and requesting regen to maintain mapping clarity.
- Excessive plan size (too many tasks/edges):
  - Cap tasks (e.g., 200) and edges (e.g., 1000). If exceeded, ask LLM to coarsen the plan.
- Unauthorized access:
  - All actions verify Clerk userId and plan ownership.
- Approved plan edits:
  - Block structural changes; allow non-structural edits only if policy flag is enabled.
- Rate limits from providers:
  - Backoff and surface friendly message; allow switching provider/model.
- Data consistency:
  - All writes in transactions; unique constraints enforce integrity.
- XSS/content safety:
  - Render task text as plain text; sanitize if rich text is introduced.
- Realtime noise:
  - Debounce UI updates; batch events by versionId.

### Testing Approach
- Unit tests
  - LLM schema validation (PlanOutputSchema) including defaults.
  - Flattening tree to rows and reconstructing parent-child.
  - Dependency mapping (sourceId -> UUID) and cycle detection.
  - Estimate aggregation.
- Integration tests
  - createPlanFromGoal: inserts plan, plan_version, tasks, task_dependencies correctly.
  - regeneratePlan: creates new version; currentVersionId updated.
  - approvePlan: status changes; event logged; edits blocked afterward.
  - updateTaskDetails and add/removeDependency flows with authorization.
- User acceptance tests (Playwright)
  - Create plan from goal and view graph/tree.
  - Edit task title and see persistence + realtime update.
  - Add a dependency; error shown on cycle attempt.
  - Regenerate with feedback and switch versions.
  - Approve plan; verify controls disabled and event shown.

Env configuration
- OPENAI_API_KEY and/or ANTHROPIC_API_KEY set in Vercel.
- Supabase URL/anon keys already configured in CodeSpring boilerplate.

Security and observability
- Ensure server actions use 'use server' and Clerk auth checks.
- Add structured logs for LLM calls (latency, model, token estimates) without sensitive contents.
- Respect PII: do not log raw user goal text in production logs unless consented.