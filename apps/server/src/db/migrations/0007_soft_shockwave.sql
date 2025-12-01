ALTER TABLE "blocks" ALTER COLUMN "id" SET DEFAULT '019adb33-46cd-7ce9-bfea-970bc3c9136e';--> statement-breakpoint
ALTER TABLE "edges" ALTER COLUMN "id" SET DEFAULT '019adb33-46cd-7ce9-bfea-970cd7f30674';--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "id" SET DEFAULT '019adb33-46cc-7aa5-a4ba-e346100873ce';--> statement-breakpoint
ALTER TABLE "routes" ALTER COLUMN "id" SET DEFAULT '019adb33-46cd-7ce9-bfea-970a211b62da';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "banned" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_reason" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_expires" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "is_system_admin" boolean DEFAULT false;