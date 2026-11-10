CREATE TABLE "habit_entries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"tracker_id" uuid NOT NULL,
	"day" date NOT NULL,
	"value" numeric(9, 2) NOT NULL,
	"secondary" numeric(9, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "habit_trackers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"name" text,
	"value_type" text,
	"unit" text,
	"goal" numeric(9, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"exercise_id" uuid,
	"target_value" numeric(6, 2) NOT NULL,
	"start_value" numeric(6, 2) NOT NULL,
	"deadline" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "dashboard_widgets" ADD COLUMN "ref" uuid;--> statement-breakpoint
ALTER TABLE "habit_entries" ADD CONSTRAINT "habit_entries_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_entries" ADD CONSTRAINT "habit_entries_tracker_id_habit_trackers_id_fk" FOREIGN KEY ("tracker_id") REFERENCES "public"."habit_trackers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_trackers" ADD CONSTRAINT "habit_trackers_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_trackers" ADD CONSTRAINT "habit_trackers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "habit_entries_tracker_day_unique" ON "habit_entries" USING btree ("tracker_id","day") WHERE "habit_entries"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "habit_entries_workspace_day_idx" ON "habit_entries" USING btree ("workspace_id","day");--> statement-breakpoint
CREATE INDEX "habit_trackers_workspace_user_idx" ON "habit_trackers" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "habit_trackers_built_in_unique" ON "habit_trackers" USING btree ("workspace_id","user_id","kind") WHERE "habit_trackers"."kind" <> 'custom' AND "habit_trackers"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "goals_workspace_user_idx" ON "goals" USING btree ("workspace_id","user_id");