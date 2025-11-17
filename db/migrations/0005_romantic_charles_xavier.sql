DO $$ BEGIN
 CREATE TYPE "public"."build_status" AS ENUM('queued', 'installing', 'building', 'completed', 'failed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."project_type" AS ENUM('nextjs', 'react', 'html', 'nodejs', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."validation_status" AS ENUM('valid', 'invalid', 'unchecked');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "build_artifacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"build_id" uuid NOT NULL,
	"file_path" text NOT NULL,
	"file_type" text NOT NULL,
	"content" text,
	"storage_path" text,
	"size_bytes" integer,
	"mime_type" text,
	"is_generated" integer DEFAULT 1,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "builds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"execution_id" uuid,
	"user_id" text NOT NULL,
	"project_name" text NOT NULL,
	"project_type" "project_type" NOT NULL,
	"status" "build_status" DEFAULT 'queued' NOT NULL,
	"build_path" text,
	"output_path" text,
	"build_logs" text,
	"error_message" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"duration_ms" integer,
	"size_bytes" bigint,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "code_generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"subtask_id" uuid,
	"user_id" text NOT NULL,
	"prompt" text NOT NULL,
	"generated_code" text NOT NULL,
	"language" text NOT NULL,
	"framework" text,
	"llm_provider" text NOT NULL,
	"llm_model" text NOT NULL,
	"tokens_used" integer,
	"generation_time_ms" integer,
	"validation_status" "validation_status" DEFAULT 'unchecked',
	"validation_errors" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "execution_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"execution_id" uuid NOT NULL,
	"run_id" uuid NOT NULL,
	"current_step" text NOT NULL,
	"step_index" integer NOT NULL,
	"total_steps" integer NOT NULL,
	"context" jsonb,
	"variables" jsonb,
	"artifacts" jsonb,
	"decisions" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "build_artifacts" ADD CONSTRAINT "build_artifacts_build_id_builds_id_fk" FOREIGN KEY ("build_id") REFERENCES "public"."builds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builds" ADD CONSTRAINT "builds_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builds" ADD CONSTRAINT "builds_execution_id_executions_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."executions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "code_generations" ADD CONSTRAINT "code_generations_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "code_generations" ADD CONSTRAINT "code_generations_subtask_id_run_subtasks_id_fk" FOREIGN KEY ("subtask_id") REFERENCES "public"."run_subtasks"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "execution_state" ADD CONSTRAINT "execution_state_execution_id_executions_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."executions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "execution_state" ADD CONSTRAINT "execution_state_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "build_artifacts_build_id_idx" ON "build_artifacts" USING btree ("build_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "build_artifacts_file_type_idx" ON "build_artifacts" USING btree ("file_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "builds_run_id_idx" ON "builds" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "builds_execution_id_idx" ON "builds" USING btree ("execution_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "builds_user_id_idx" ON "builds" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "builds_status_idx" ON "builds" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "builds_created_at_idx" ON "builds" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "code_generations_run_id_idx" ON "code_generations" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "code_generations_subtask_id_idx" ON "code_generations" USING btree ("subtask_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "code_generations_user_id_idx" ON "code_generations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "code_generations_created_at_idx" ON "code_generations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "execution_state_execution_id_idx" ON "execution_state" USING btree ("execution_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "execution_state_run_id_idx" ON "execution_state" USING btree ("run_id");