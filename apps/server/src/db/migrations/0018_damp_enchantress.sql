CREATE TYPE "public"."ai_chat_conversation_status" AS ENUM('running', 'completed');--> statement-breakpoint
CREATE TABLE "ai_chat_conversations" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"user_id" varchar(50),
	"title" varchar(255) DEFAULT 'New chat',
	"metadata" jsonb NOT NULL,
	"status" "ai_chat_conversation_status" DEFAULT 'running',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_chat_history" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"conversation_id" varchar(50),
	"status" "ai_chat_conversation_status" DEFAULT 'running',
	"final_output" jsonb,
	"workflow_execution_history" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_chat_conversations" ADD CONSTRAINT "ai_chat_conversations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_chat_history" ADD CONSTRAINT "ai_chat_history_conversation_id_ai_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_chat_conversations"("id") ON DELETE cascade ON UPDATE no action;