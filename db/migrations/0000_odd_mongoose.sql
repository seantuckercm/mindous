DO $$ BEGIN
 CREATE TYPE "public"."membership" AS ENUM('free', 'pro');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."payment_provider" AS ENUM('stripe', 'whop');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."task_status" AS ENUM('pending', 'in_progress', 'completed', 'failed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."agent_type" AS ENUM('planner', 'researcher', 'coder', 'reviewer', 'executor', 'custom');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."execution_status" AS ENUM('queued', 'running', 'completed', 'failed', 'cancelled', 'timeout');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."llm_provider" AS ENUM('openai', 'anthropic', 'google', 'azure', 'custom');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"email" text,
	"membership" "membership" DEFAULT 'free' NOT NULL,
	"payment_provider" "payment_provider" DEFAULT 'whop',
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"whop_user_id" text,
	"whop_membership_id" text,
	"plan_duration" text,
	"billing_cycle_start" timestamp,
	"billing_cycle_end" timestamp,
	"next_credit_renewal" timestamp,
	"usage_credits" integer DEFAULT 0,
	"used_credits" integer DEFAULT 0,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pending_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"token" text,
	"membership" "membership" DEFAULT 'pro' NOT NULL,
	"payment_provider" "payment_provider" DEFAULT 'whop',
	"whop_user_id" text,
	"whop_membership_id" text,
	"plan_duration" text,
	"billing_cycle_start" timestamp,
	"billing_cycle_end" timestamp,
	"next_credit_renewal" timestamp,
	"usage_credits" integer DEFAULT 0,
	"used_credits" integer DEFAULT 0,
	"claimed" boolean DEFAULT false,
	"claimed_by_user_id" text,
	"claimed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pending_profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "task_status" DEFAULT 'pending' NOT NULL,
	"parent_task_id" uuid,
	"metadata" jsonb,
	"result" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "agent_type" NOT NULL,
	"description" text,
	"capabilities" jsonb NOT NULL,
	"config" jsonb NOT NULL,
	"system_prompt" text,
	"is_active" text DEFAULT 'true',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"agent_id" uuid,
	"status" "execution_status" DEFAULT 'queued' NOT NULL,
	"start_time" timestamp,
	"end_time" timestamp,
	"result" jsonb,
	"error" text,
	"logs" jsonb,
	"metrics" jsonb,
	"retry_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "llm_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"provider" "llm_provider" NOT NULL,
	"model" text NOT NULL,
	"api_key" text,
	"endpoint" text,
	"routing_rules" jsonb,
	"parameters" jsonb,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"priority" integer DEFAULT 0,
	"rate_limit" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "context" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"execution_id" uuid NOT NULL,
	"context_type" text NOT NULL,
	"context_data" jsonb NOT NULL,
	"metadata" jsonb,
	"sequence_number" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "executions" ADD CONSTRAINT "executions_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "executions" ADD CONSTRAINT "executions_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "context" ADD CONSTRAINT "context_execution_id_executions_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."executions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agents_type_idx" ON "agents" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agents_name_idx" ON "agents" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "executions_task_id_idx" ON "executions" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "executions_agent_id_idx" ON "executions" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "executions_status_idx" ON "executions" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "executions_created_at_idx" ON "executions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "llm_configs_provider_idx" ON "llm_configs" USING btree ("provider");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "llm_configs_user_id_idx" ON "llm_configs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "llm_configs_is_active_idx" ON "llm_configs" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "llm_configs_priority_idx" ON "llm_configs" USING btree ("priority");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "context_execution_id_idx" ON "context" USING btree ("execution_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "context_type_idx" ON "context" USING btree ("context_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "context_sequence_idx" ON "context" USING btree ("execution_id","sequence_number");