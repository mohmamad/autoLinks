import { planTask } from "./planner.js";
import { executePlan } from "./executor.js";

export async function runAgent(goal: string) {
  const plan = await planTask(goal);

  const result = await executePlan(plan);

  return {
    success: true,
    output: result,
  };
}
