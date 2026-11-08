CREATE TABLE "user_profile" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"goal" text NOT NULL,
	"experience" text NOT NULL,
	"weight_kg" numeric(5, 2) NOT NULL,
	"height_cm" smallint NOT NULL,
	"session_minutes" smallint,
	"training_place" text,
	"onboarding_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "user_profile_weight_range" CHECK ("user_profile"."weight_kg" between 30 and 300),
	CONSTRAINT "user_profile_height_range" CHECK ("user_profile"."height_cm" between 100 and 250)
);
--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "media_source" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "media_start_path" text;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "media_end_path" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_profile_user_unique" ON "user_profile" USING btree ("user_id");