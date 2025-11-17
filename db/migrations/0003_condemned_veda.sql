DO $$ BEGIN
 CREATE TYPE "public"."tool_run_status" AS ENUM('queued', 'running', 'succeeded', 'failed', 'timed_out', 'canceled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tool_artifacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tool_run_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"storage_path" text NOT NULL,
	"checksum" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tool_run_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tool_run_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"ts" timestamp with time zone DEFAULT now() NOT NULL,
	"level" text DEFAULT 'info' NOT NULL,
	"message" text NOT NULL,
	"data" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tool_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"execution_id" uuid NOT NULL,
	"tool_id" uuid NOT NULL,
	"requested_by_user_id" text,
	"status" "tool_run_status" DEFAULT 'queued' NOT NULL,
	"input_payload" jsonb NOT NULL,
	"output_payload" jsonb,
	"error" text,
	"logs_tail" text,
	"cpu_seconds" numeric,
	"memory_mb" integer,
	"exit_code" integer,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"version" text DEFAULT '1.0.0' NOT NULL,
	"description" text,
	"manifest" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"container_image" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tool_artifacts" ADD CONSTRAINT "tool_artifacts_tool_run_id_tool_runs_id_fk" FOREIGN KEY ("tool_run_id") REFERENCES "public"."tool_runs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tool_run_events" ADD CONSTRAINT "tool_run_events_tool_run_id_tool_runs_id_fk" FOREIGN KEY ("tool_run_id") REFERENCES "public"."tool_runs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tool_runs" ADD CONSTRAINT "tool_runs_execution_id_executions_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."executions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tool_runs" ADD CONSTRAINT "tool_runs_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tool_artifacts_run_idx" ON "tool_artifacts" USING btree ("tool_run_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tool_artifacts_workspace_idx" ON "tool_artifacts" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tool_run_events_run_idx" ON "tool_run_events" USING btree ("tool_run_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tool_run_events_ts_idx" ON "tool_run_events" USING btree ("ts");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tool_runs_workspace_idx" ON "tool_runs" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tool_runs_execution_idx" ON "tool_runs" USING btree ("execution_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tool_runs_tool_idx" ON "tool_runs" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tool_runs_status_idx" ON "tool_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tool_runs_created_at_idx" ON "tool_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tools_workspace_idx" ON "tools" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tools_workspace_key_idx" ON "tools" USING btree ("workspace_id","key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tools_active_idx" ON "tools" USING btree ("active");