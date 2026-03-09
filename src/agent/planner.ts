import { callLLM } from "./llm.js";

export async function planTask(goal: string) {
  const prompt = `
Break this goal into steps.

Goal:
${goal}

Return steps as a list.
`;

  const result = await callLLM(prompt);

  return result;
}
