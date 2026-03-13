import { callLLM } from "./llm.js";
import {
  loadSkills as loadSkillsFromPrompts,
  buildSystemPrompt,
  Skill,
  SkillsConfig,
} from "../prompts/systemPrompt.js";

export type { Skill, SkillsConfig };

export const loadSkills = loadSkillsFromPrompts;

export async function runWithSkills(userMessage: string): Promise<string> {
  const config = loadSkills();
  const systemPrompt = buildSystemPrompt(config.skills);

  const prompt = `
${systemPrompt}

User request:
${userMessage}
`;

  const result = await callLLM(prompt);
  return result;
}
