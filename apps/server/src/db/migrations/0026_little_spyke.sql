ALTER TABLE "test_suites" ADD COLUMN "integration_overrides" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "test_suites" ADD COLUMN "app_config_overrides" jsonb DEFAULT '[]'::jsonb;