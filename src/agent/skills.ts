import { callLLM } from "./llm.js";
import {
  loadSkills as loadSkillsFromPrompts,
  buildSystemPrompt,
  Skill,
  SkillsConfig,
} from "../prompts/systemPrompt.js";
import fs from "fs";
import path from "path";

export type { Skill, SkillsConfig };

export const loadSkills = loadSkillsFromPrompts;

const SKILLS_PATH = path.join(process.cwd(), "src/skills/skills.json");

export function saveSkills(config: SkillsConfig): void {
  fs.writeFileSync(SKILLS_PATH, JSON.stringify(config, null, 2));
}

export async function runWithSkills(userMessage: string): Promise<string> {
  const config = loadSkills();
  const systemPrompt = buildSystemPrompt(config.skills);

  const prompt = `
System: ${systemPrompt}

User: ${userMessage}

Assistant:
`;

  return callLLM(prompt);
}
