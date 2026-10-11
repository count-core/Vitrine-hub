CREATE TYPE "public"."member_role" AS ENUM('owner', 'editor', 'viewer');--> statement-breakpoint
CREATE TABLE "collection_member" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "member_role" DEFAULT 'viewer' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invite" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection_id" text NOT NULL,
	"code" text NOT NULL,
	"role" "member_role" DEFAULT 'viewer' NOT NULL,
	"label" text DEFAULT '' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_by" text,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invite_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "item" ADD COLUMN "reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "collection_member" ADD CONSTRAINT "collection_member_collection_id_collection_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_member" ADD CONSTRAINT "collection_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite" ADD CONSTRAINT "invite_collection_id_collection_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite" ADD CONSTRAINT "invite_used_by_user_id_fk" FOREIGN KEY ("used_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "collection_member_unique" ON "collection_member" USING btree ("collection_id","user_id");