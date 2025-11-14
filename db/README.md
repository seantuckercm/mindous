# Database Schema Setup - Mindous.ai

## Overview

This directory contains the Drizzle ORM configuration and database schema for the Mindous.ai AI agent orchestration platform.

## Schema Structure

### Core Tables

1. **tasks** - Stores user tasks and subtasks with decomposition hierarchy
   - Self-referencing parent-child relationship for task decomposition
   - Status tracking: pending, in_progress, completed, failed, cancelled
   - Supports metadata and result storage in JSONB

2. **agents** - Stores agent configurations and capabilities
   - Types: planner, researcher, coder, reviewer, executor, custom
   - Capabilities and config stored as JSONB
   - Indexed by type and name for efficient lookups

3. **executions** - Tracks task execution runs and status
   - Links tasks with agents
   - Status tracking: queued, running, completed, failed, cancelled, timeout
   - Stores logs, results, metrics, and error messages
   - Cascade delete on task deletion
   - Indexed by task_id, agent_id, status, and created_at

4. **llm_configs** - Stores LLM provider configurations and routing rules
   - Supports multiple providers: openai, anthropic, google, azure, custom
   - Routing rules and parameters stored as JSONB
   - Priority-based config selection
   - Rate limiting configuration

5. **context** - Stores execution context and memory
   - Links to executions with cascade delete
   - Context types: memory, tool_output, intermediate_result
   - Sequence tracking for ordered context retrieval
   - Indexed by execution_id, context_type, and sequence

### Relationships

```
tasks (1) ----< (many) executions
agents (1) ----< (many) executions
executions (1) ----< (many) context
tasks (parent) ----< (many) tasks (children)
```

## Files Structure

```
db/
├── schema/
│   ├── index.ts                    # Exports all schemas
│   ├── tasks.ts                    # Tasks table schema
│   ├── agents.ts                   # Agents table schema
│   ├── executions.ts               # Executions table schema
│   ├── llmConfigs.ts              # LLM configs table schema
│   ├── context.ts                  # Context table schema
│   ├── profiles-schema.ts          # User profiles (existing)
│   └── pending-profiles-schema.ts  # Pending profiles (existing)
├── migrations/
│   └── 0000_odd_mongoose.sql      # Initial migration
├── db.ts                           # Database client and connection
└── README.md                       # This file
```

## Migration Generated

The initial migration has been generated and includes:

- ✅ All enum types (task_status, agent_type, execution_status, llm_provider)
- ✅ All 7 tables with proper structure
- ✅ Foreign key constraints with cascade/set null behavior
- ✅ 13 indexes for efficient queries
- ✅ Default values and NOT NULL constraints

## Database Commands

```bash
# Generate migrations from schema changes
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Push schema directly to database (dev mode)
npm run db:push

# Open Drizzle Studio to view/edit data
npm run db:studio
```

## Applying the Migration

### Option 1: Using Drizzle Kit (Recommended for production)

```bash
npm run db:push
```

### Option 2: Using psql directly

If you encounter connectivity issues with drizzle-kit, you can apply the migration manually:

```bash
# Replace with your actual connection details
PGPASSWORD='your-password' psql -h your-host.supabase.co -U postgres -d postgres -f db/migrations/0000_odd_mongoose.sql
```

### Option 3: Using custom migration script

```bash
npx tsx scripts/migrate.ts
```

### Option 4: Via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `db/migrations/0000_odd_mongoose.sql`
4. Paste and run in the SQL Editor

## Connection Notes

The `DATABASE_URL` in `.env.local` has been updated to URL-encode special characters in the password:
- Original: `#` in password
- Encoded: `%23` in DATABASE_URL

## TypeScript Types

All schemas export TypeScript types for type-safe database operations:

```typescript
import type { InsertTask, SelectTask } from "./db/schema/tasks";
import type { InsertAgent, SelectAgent } from "./db/schema/agents";
import type { InsertExecution, SelectExecution } from "./db/schema/executions";
import type { InsertLlmConfig, SelectLlmConfig } from "./db/schema/llmConfigs";
import type { InsertContext, SelectContext } from "./db/schema/context";
```

## Usage Example

```typescript
import { db } from "./db/db";
import { tasksTable, agentsTable, executionsTable } from "./db/schema";

// Create a new task
const newTask = await db.insert(tasksTable).values({
  userId: "user_123",
  title: "Build a web scraper",
  description: "Create a Python web scraper for product data",
  status: "pending"
}).returning();

// Query executions with relationships
const executions = await db.query.executions.findMany({
  with: {
    task: true,
    agent: true,
    contexts: true
  },
  where: (executions, { eq }) => eq(executions.status, "running")
});
```

## Next Steps

1. ✅ Schema files created
2. ✅ Migration generated
3. ⏳ Apply migration to Supabase (pending network connectivity)
4. ⏳ Test database connection and queries
5. ⏳ Seed initial agent configurations
6. ⏳ Implement API routes for CRUD operations
