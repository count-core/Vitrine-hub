CREATE TYPE "public"."price_kind" AS ENUM('observed', 'ai_estimate', 'catalog', 'sold');--> statement-breakpoint
CREATE TABLE "price_observation" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"kind" "price_kind" DEFAULT 'observed' NOT NULL,
	"source" text DEFAULT '' NOT NULL,
	"price" numeric(12, 2),
	"price_max" numeric(12, 2),
	"currency" text DEFAULT 'EUR' NOT NULL,
	"condition" "condition",
	"observed_at" timestamp DEFAULT now() NOT NULL,
	"url" text DEFAULT '' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"confidence" numeric(4, 3),
	"ai_raw" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "price_observation" ADD CONSTRAINT "price_observation_item_id_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_observation" ADD CONSTRAINT "price_observation_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "price_observation_item_idx" ON "price_observation" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "price_observation_owner_idx" ON "price_observation" USING btree ("owner_id");