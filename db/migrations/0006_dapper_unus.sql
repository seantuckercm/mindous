DO $$ BEGIN
 CREATE TYPE "public"."preview_status" AS ENUM('starting', 'running', 'stopped', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "preview_deployments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"build_id" uuid NOT NULL,
	"preview_url" text NOT NULL,
	"internal_port" integer NOT NULL,
	"status" "preview_status" DEFAULT 'starting' NOT NULL,
	"process_id" text,
	"started_at" timestamp,
	"stopped_at" timestamp,
	"last_accessed_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "preview_deployments" ADD CONSTRAINT "preview_deployments_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "preview_deployments" ADD CONSTRAINT "preview_deployments_build_id_builds_id_fk" FOREIGN KEY ("build_id") REFERENCES "public"."builds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "preview_deployments_run_id_idx" ON "preview_deployments" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "preview_deployments_build_id_idx" ON "preview_deployments" USING btree ("build_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "preview_deployments_status_idx" ON "preview_deployments" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "preview_deployments_created_at_idx" ON "preview_deployments" USING btree ("created_at");