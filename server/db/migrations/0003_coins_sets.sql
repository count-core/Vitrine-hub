ALTER TYPE "public"."item_type" ADD VALUE IF NOT EXISTS 'stamp_set';--> statement-breakpoint
ALTER TYPE "public"."item_type" ADD VALUE IF NOT EXISTS 'coin_set';--> statement-breakpoint
ALTER TYPE "public"."item_type" ADD VALUE IF NOT EXISTS 'banknote';--> statement-breakpoint
ALTER TABLE "item" ADD COLUMN "series" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "item" ADD COLUMN "grade" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "item" ADD COLUMN "material" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "item" ADD COLUMN "mint" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "item" ADD COLUMN "diameter_mm" numeric(6, 2);--> statement-breakpoint
ALTER TABLE "item" ADD COLUMN "weight_g" numeric(8, 3);--> statement-breakpoint
ALTER TABLE "item" DROP COLUMN IF EXISTS "search_text";--> statement-breakpoint
ALTER TABLE "item" ADD COLUMN "search_text" text GENERATED ALWAYS AS (lower(coalesce(michel_no,'') || ' ' || coalesce(motif,'') || ' ' || coalesce(area,'') || ' ' || coalesce(country,'') || ' ' || coalesce(year::text,'') || ' ' || coalesce(face_value,'') || ' ' || coalesce(series,'') || ' ' || coalesce(grade,'') || ' ' || coalesce(mint,'') || ' ' || coalesce(material,'') || ' ' || coalesce(public_note,'') || ' ' || coalesce(private_note,''))) STORED;
