CREATE TYPE "public"."condition" AS ENUM('mnh', 'hinged', 'no_gum', 'used', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."item_status" AS ENUM('collection', 'duplicate', 'for_sale', 'sold', 'wanted');--> statement-breakpoint
CREATE TYPE "public"."item_type" AS ENUM('stamp', 'block', 'booklet', 'cover', 'coin');--> statement-breakpoint
CREATE TYPE "public"."item_visibility" AS ENUM('inherit', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."visibility" AS ENUM('private', 'link', 'public');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "album" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection_id" text NOT NULL,
	"number" integer NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "capture" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"file_key" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"provider" text,
	"model" text,
	"result" jsonb,
	"error" text,
	"duration_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collection" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"visibility" "visibility" DEFAULT 'private' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"album_id" text,
	"sheet" integer,
	"position" integer,
	"type" "item_type" DEFAULT 'stamp' NOT NULL,
	"area" text DEFAULT '' NOT NULL,
	"country" text DEFAULT '' NOT NULL,
	"year" integer,
	"michel_no" text DEFAULT '' NOT NULL,
	"face_value" text DEFAULT '' NOT NULL,
	"motif" text DEFAULT '' NOT NULL,
	"color" text DEFAULT '' NOT NULL,
	"condition" "condition" DEFAULT 'unknown' NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"status" "item_status" DEFAULT 'collection' NOT NULL,
	"public_note" text DEFAULT '' NOT NULL,
	"visibility" "item_visibility" DEFAULT 'inherit' NOT NULL,
	"catalog_value" numeric(12, 2),
	"est_value" numeric(12, 2),
	"private_note" text DEFAULT '' NOT NULL,
	"ai_confidence" numeric(4, 3),
	"ai_suggestion" jsonb,
	"capture_id" text,
	"box" jsonb,
	"search_text" text GENERATED ALWAYS AS (lower(coalesce(michel_no,'') || ' ' || coalesce(motif,'') || ' ' || coalesce(area,'') || ' ' || coalesce(country,'') || ' ' || coalesce(year::text,'') || ' ' || coalesce(face_value,'') || ' ' || coalesce(public_note,'') || ' ' || coalesce(private_note,''))) STORED,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item_image" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" text NOT NULL,
	"file_key" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "album" ADD CONSTRAINT "album_collection_id_collection_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capture" ADD CONSTRAINT "capture_collection_id_collection_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capture" ADD CONSTRAINT "capture_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection" ADD CONSTRAINT "collection_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item" ADD CONSTRAINT "item_collection_id_collection_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item" ADD CONSTRAINT "item_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item" ADD CONSTRAINT "item_album_id_album_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."album"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item" ADD CONSTRAINT "item_capture_id_capture_id_fk" FOREIGN KEY ("capture_id") REFERENCES "public"."capture"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_image" ADD CONSTRAINT "item_image_item_id_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "album_collection_number_idx" ON "album" USING btree ("collection_id","number");--> statement-breakpoint
CREATE INDEX "capture_collection_idx" ON "capture" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "collection_owner_idx" ON "collection" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "item_collection_idx" ON "item" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "item_album_sheet_idx" ON "item" USING btree ("album_id","sheet","position");--> statement-breakpoint
CREATE INDEX "item_search_trgm_idx" ON "item" USING gin ("search_text" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "item_image_item_idx" ON "item_image" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");