ALTER TABLE "exercises" ADD COLUMN "slug" text;--> statement-breakpoint
CREATE UNIQUE INDEX "exercises_slug_unique" ON "exercises" USING btree ("slug");