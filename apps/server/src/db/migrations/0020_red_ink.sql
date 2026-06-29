ALTER TYPE "public"."ai_chat_conversation_status" ADD VALUE 'not_started' BEFORE 'running';--> statement-breakpoint
ALTER TABLE "ai_chat_conversations" ALTER COLUMN "status" SET DEFAULT 'not_started';