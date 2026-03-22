import { runWithSkills } from "../agent/skills.js";
import { ActionPlan } from "../types/agent.types.js";
import { validateActionPlan } from "../agent/validator.js";
import { hitUrl, sendEmail, sendSlackMessage } from "./subscripers.js";
import { jobService } from "../services/jobService.js";
import { pipelineService } from "../services/pipelineService.js";

const WORKER_RETRY_BASE_MS = Number(process.env.WORKER_RETRY_BASE_MS ?? 5000);

export async function executeJob(): Promise<boolean> {
  const job = await jobService.getNextJobWithPipeline();
  if (!job) {
    return false;
  }

  const actionPlan = await getActionPlan(
    job.pipelines.description,
    job.jobs.payload,
  );

  const subscripers = (await pipelineService.listSubscribers(
    job.pipelines.id,
  )) as Subscriber[];

  let isSuccessful = true;

  for (const subscriper of subscripers) {
    switch (subscriper.type) {
      case "slack":
        isSuccessful = await sendSlackMessage(actionPlan, subscriper);
        break;
      case "email":
        isSuccessful = await sendEmail(actionPlan, subscriper);
        break;
      case "http request":
        isSuccessful = await hitUrl(actionPlan, subscriper);
        break;
    }

    if (!isSuccessful) {
      break;
    }
  }

  if (isSuccessful) {
    await jobService.markJobDone(job.jobs.id);
    return true;
  }

  const nextRetryCount = job.jobs.retry_count + 1;
  if (nextRetryCount <= job.jobs.max_retries) {
    const delayMultiplier = Math.pow(2, job.jobs.retry_count);
    const delayMs = WORKER_RETRY_BASE_MS * delayMultiplier;
    const nextRunAt = new Date(Date.now() + delayMs);
    await jobService.scheduleRetry(job.jobs.id, nextRetryCount, nextRunAt);
  } else {
    await jobService.markJobFailed(job.jobs.id);
  }

  return true;
}

export async function getActionPlan(message: string, payload: string | null) {
  try {
    const aiMessage = `${message} data: [ ${payload} ]`;
    const result = await runWithSkills(aiMessage);

    const actionPlan: ActionPlan = JSON.parse(result);
    if (validateActionPlan(actionPlan)) {
      return actionPlan;
    } else {
      throw new Error("Failed to get response");
    }
  } catch (error) {
    console.error("Agent error", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to get response");
  }
}
