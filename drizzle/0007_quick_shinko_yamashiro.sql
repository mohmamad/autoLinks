CREATE TYPE "public"."subscriper_type" AS ENUM('slack', 'email', 'http request');--> statement-breakpoint
ALTER TABLE "subscripers" ADD COLUMN "type" "subscriper_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "subscripers" ADD COLUMN "config" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "subscripers" DROP COLUMN "url";--> statement-breakpoint
ALTER TABLE "subscripers" DROP COLUMN "method";--> statement-breakpoint
ALTER TABLE "subscripers" DROP COLUMN "headers";