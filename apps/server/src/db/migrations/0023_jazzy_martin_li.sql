ALTER TABLE "app_config" ADD COLUMN "project_id" varchar(50);--> statement-breakpoint
ALTER TABLE "integrations" ADD COLUMN "project_id" varchar(50);--> statement-breakpoint
ALTER TABLE "app_config" ADD CONSTRAINT "app_config_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_app_config_project_id" ON "app_config" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_integrations_project_id" ON "integrations" USING btree ("project_id");