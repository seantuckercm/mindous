DO $$ BEGIN
 CREATE TYPE "public"."event_type" AS ENUM('RUN_STARTED', 'RUN_PROGRESS', 'RUN_PAUSED', 'RUN_RESUMED', 'RUN_COMPLETED', 'RUN_FAILED', 'RUN_CANCELLED', 'RUN_ERROR', 'SUBTASK_CREATED', 'SUBTASK_STARTED', 'SUBTASK_PROGRESS', 'SUBTASK_COMPLETED', 'SUBTASK_FAILED', 'SUBTASK_SKIPPED', 'ARTIFACT_CREATED', 'ARTIFACT_UPDATED', 'LOG_MESSAGE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."run_status" AS ENUM('queued', 'starting', 'running', 'paused', 'resuming', 'completed', 'failed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."subtask_status" AS ENUM('pending', 'in_progress', 'completed', 'failed', 'skipped');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "run_artifacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"subtask_id" uuid,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"path" text,
	"content" text,
	"size" integer,
	"mime_type" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "run_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"subtask_id" uuid,
	"event_type" "event_type" NOT NULL,
	"message" text NOT NULL,
	"data" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "run_subtasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"parent_subtask_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"status" "subtask_status" DEFAULT 'pending' NOT NULL,
	"order" integer NOT NULL,
	"progress" integer DEFAULT 0,
	"start_time" timestamp,
	"end_time" timestamp,
	"duration" integer,
	"result" jsonb,
	"error" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"execution_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"status" "run_status" DEFAULT 'queued' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"progress" integer DEFAULT 0,
	"current_step" text,
	"total_steps" integer DEFAULT 0,
	"completed_steps" integer DEFAULT 0,
	"start_time" timestamp,
	"end_time" timestamp,
	"paused_at" timestamp,
	"resumed_at" timestamp,
	"metadata" jsonb,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "run_artifacts" ADD CONSTRAINT "run_artifacts_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "run_artifacts" ADD CONSTRAINT "run_artifacts_subtask_id_run_subtasks_id_fk" FOREIGN KEY ("subtask_id") REFERENCES "public"."run_subtasks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "run_events" ADD CONSTRAINT "run_events_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "run_events" ADD CONSTRAINT "run_events_subtask_id_run_subtasks_id_fk" FOREIGN KEY ("subtask_id") REFERENCES "public"."run_subtasks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "run_subtasks" ADD CONSTRAINT "run_subtasks_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "runs" ADD CONSTRAINT "runs_execution_id_executions_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."executions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "run_artifacts_run_id_idx" ON "run_artifacts" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "run_artifacts_subtask_id_idx" ON "run_artifacts" USING btree ("subtask_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "run_artifacts_type_idx" ON "run_artifacts" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "run_artifacts_created_at_idx" ON "run_artifacts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "run_events_run_id_idx" ON "run_events" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "run_events_subtask_id_idx" ON "run_events" USING btree ("subtask_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "run_events_event_type_idx" ON "run_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "run_events_timestamp_idx" ON "run_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "run_subtasks_run_id_idx" ON "run_subtasks" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "run_subtasks_parent_subtask_id_idx" ON "run_subtasks" USING btree ("parent_subtask_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "run_subtasks_status_idx" ON "run_subtasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "run_subtasks_order_idx" ON "run_subtasks" USING btree ("order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "runs_execution_id_idx" ON "runs" USING btree ("execution_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "runs_user_id_idx" ON "runs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "runs_status_idx" ON "runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "runs_created_at_idx" ON "runs" USING btree ("created_at");