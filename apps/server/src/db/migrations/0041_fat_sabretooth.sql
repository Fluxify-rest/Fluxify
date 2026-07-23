CREATE TABLE "sso_allowlist" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"user_id" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sso_allowlist_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "sso_allowlist" ADD CONSTRAINT "sso_allowlist_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;