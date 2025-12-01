CREATE TYPE "public"."access_control_roles" AS ENUM('viewer', 'creator', 'project_admin', 'system_admin');--> statement-breakpoint
CREATE TABLE "access_control" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(50),
	"project_id" varchar(50),
	"role" "access_control_roles",
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "blocks" ALTER COLUMN "id" SET DEFAULT '019acc0e-49dd-765a-a656-e8f1eccb56ea';--> statement-breakpoint
ALTER TABLE "edges" ALTER COLUMN "id" SET DEFAULT '019acc0e-49dd-765a-a656-e8f2af0a129c';--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "id" SET DEFAULT '019acc0e-49db-7a1b-a099-c6fa0d0e1100';--> statement-breakpoint
ALTER TABLE "routes" ALTER COLUMN "id" SET DEFAULT '019acc0e-49dc-7c5b-aca6-ef45a432cd74';--> statement-breakpoint
ALTER TABLE "access_control" ADD CONSTRAINT "access_control_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_control" ADD CONSTRAINT "access_control_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_access_control_user_id" ON "access_control" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_access_control_project_id" ON "access_control" USING btree ("project_id");