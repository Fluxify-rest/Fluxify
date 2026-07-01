ALTER TABLE "ai_chat_history" ALTER COLUMN "conversation_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_chat_history" ALTER COLUMN "workflow_execution_history" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_chat_history" DROP COLUMN "updated_at";