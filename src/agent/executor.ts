import { callLLM } from "./llm.js";

export async function executePlan(plan: string) {
  const prompt = `
Execute the following plan.

${plan}

Return the final result.
`;

  return callLLM(prompt);
}
