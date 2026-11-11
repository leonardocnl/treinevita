CREATE TABLE "user_avatars" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"bytes" "bytea" NOT NULL,
	"mime" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_avatars_size" CHECK (octet_length("user_avatars"."bytes") <= 307200),
	CONSTRAINT "user_avatars_mime" CHECK ("user_avatars"."mime" in ('image/webp', 'image/jpeg', 'image/png'))
);
--> statement-breakpoint
ALTER TABLE "user_avatars" ADD CONSTRAINT "user_avatars_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;