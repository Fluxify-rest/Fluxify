CREATE TABLE "ai_chat" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"role" varchar(50),
	"content" text,
	"user_id" varchar(50),
	"route_id" varchar(50),
	"ai_response" jsonb,
	"tool_calls" jsonb,
	"message_stage" integer DEFAULT 0,
	"action_state" integer DEFAULT 0,
	"token_usage" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_chat" ADD CONSTRAINT "ai_chat_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_chat" ADD CONSTRAINT "ai_chat_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ai_chat_route_id" ON "ai_chat" USING btree ("route_id");--> statement-breakpoint
CREATE INDEX "idx_ai_chat_created_at" ON "ai_chat" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_ai_chat_user_id" ON "ai_chat" USING btree ("user_id");