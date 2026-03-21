CREATE TYPE "public"."job_status" AS ENUM('pending', 'done', 'failed');--> statement-breakpoint
CREATE TABLE "pipelines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"webhook_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jobs" DROP CONSTRAINT "jobs_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "status" "job_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "pipline_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "pipelines" ADD CONSTRAINT "pipelines_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_pipline_id_pipelines_id_fk" FOREIGN KEY ("pipline_id") REFERENCES "public"."pipelines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "jobs" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "jobs" DROP COLUMN "user_id";