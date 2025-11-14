CREATE TABLE IF NOT EXISTS "llm_circuit_breakers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"state" text DEFAULT 'closed' NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"opened_at" timestamp,
	"next_attempt_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "llm_circuit_breakers_unique" UNIQUE("provider","model")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "llm_provider_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"cost_per_1k_input_usd" numeric(10, 6) NOT NULL,
	"cost_per_1k_output_usd" numeric(10, 6) NOT NULL,
	"latency_avg_ms" integer DEFAULT 0 NOT NULL,
	"latency_p95_ms" integer DEFAULT 0 NOT NULL,
	"success_rate" numeric(5, 4) DEFAULT '0' NOT NULL,
	"total_calls" integer DEFAULT 0 NOT NULL,
	"error_rate" numeric(5, 4) DEFAULT '0' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "llm_provider_stats_provider_model_unique" UNIQUE("provider","model")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "llm_route_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope" text DEFAULT 'system' NOT NULL,
	"owner_id" text,
	"prompt_hash" text NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"response" jsonb NOT NULL,
	"tokens_output" integer,
	"hit_count" integer DEFAULT 0 NOT NULL,
	"last_hit_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "llm_route_cache_unique" UNIQUE("scope","owner_id","prompt_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "llm_usage_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"correlation_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"subtask_id" uuid,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"prompt_hash" text NOT NULL,
	"status" text NOT NULL,
	"error_code" text,
	"error_message" text,
	"latency_ms" integer,
	"tokens_input" integer,
	"tokens_output" integer,
	"cost_estimate_usd" numeric(12, 6),
	"cache_hit" boolean DEFAULT false NOT NULL,
	"routed_score" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "llm_route_cache_idx" ON "llm_route_cache" USING btree ("prompt_hash","expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "llm_usage_logs_provider_idx" ON "llm_usage_logs" USING btree ("provider","model");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "llm_usage_logs_subtask_idx" ON "llm_usage_logs" USING btree ("subtask_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "llm_usage_logs_prompt_idx" ON "llm_usage_logs" USING btree ("prompt_hash");