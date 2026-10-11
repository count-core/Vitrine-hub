ALTER TABLE "collection" ADD COLUMN IF NOT EXISTS "ai_provider" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "collection" ADD COLUMN IF NOT EXISTS "ai_model" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "collection" ADD COLUMN IF NOT EXISTS "ai_api_key_enc" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "collection" ADD COLUMN IF NOT EXISTS "ai_base_url" text DEFAULT '' NOT NULL;
