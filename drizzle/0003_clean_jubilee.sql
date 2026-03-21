ALTER TABLE "pipelines" RENAME COLUMN "webhook_url" TO "webhook_id";--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "payload" text;