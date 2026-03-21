ALTER TABLE "subscribers" RENAME TO "subscripers";--> statement-breakpoint
ALTER TABLE "subscripers" DROP CONSTRAINT "subscribers_pipeline_id_pipelines_id_fk";
--> statement-breakpoint
ALTER TABLE "subscripers" ADD CONSTRAINT "subscripers_pipeline_id_pipelines_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipelines"("id") ON DELETE cascade ON UPDATE no action;