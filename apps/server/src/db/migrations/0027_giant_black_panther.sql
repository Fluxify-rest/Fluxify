CREATE TYPE "public"."custom_block_icon_type" AS ENUM('premade-list', 'custom');--> statement-breakpoint
CREATE TYPE "public"."custom_block_source_type" AS ENUM('plugin', 'inhouse');--> statement-breakpoint
CREATE TABLE "custom_block_graphs" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"custom_block_id" varchar(50),
	"type" varchar(100),
	"data" jsonb,
	"next_block_id" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "custom_blocks_list" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"label" varchar(50) NOT NULL,
	"description" text,
	"icon" "custom_block_icon_type",
	"icon_url" text,
	"project_id" varchar(50),
	"input_params" jsonb,
	"source_type" "custom_block_source_type" DEFAULT 'inhouse',
	"source" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "custom_block_graphs" ADD CONSTRAINT "custom_block_graphs_custom_block_id_custom_blocks_list_id_fk" FOREIGN KEY ("custom_block_id") REFERENCES "public"."custom_blocks_list"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_blocks_list" ADD CONSTRAINT "custom_blocks_list_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_custom_block_graphs_custom_block_id" ON "custom_block_graphs" USING btree ("custom_block_id");--> statement-breakpoint
CREATE INDEX "idx_custom_blocks_list_project_id" ON "custom_blocks_list" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_custom_blocks_list_name" ON "custom_blocks_list" USING btree ("name");