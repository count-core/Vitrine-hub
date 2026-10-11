CREATE TABLE "inquiry" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection_id" text NOT NULL,
	"item_id" text,
	"kind" text DEFAULT 'question' NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"offer_price" numeric(12, 2),
	"read_at" timestamp,
	"ip" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "collection" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "collection" ADD COLUMN "public_title" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "collection" ADD COLUMN "public_intro" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "collection" ADD COLUMN "public_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "collection" ADD COLUMN "show_wanted" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "collection" ADD COLUMN "allow_inquiries" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "item" ADD COLUMN "wanted_max_price" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "inquiry" ADD CONSTRAINT "inquiry_collection_id_collection_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiry" ADD CONSTRAINT "inquiry_item_id_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."item"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inquiry_collection_idx" ON "inquiry" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "inquiry_created_idx" ON "inquiry" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "collection" ADD CONSTRAINT "collection_slug_unique" UNIQUE("slug");