import fs from "fs";
import path from "path";

export type Skill = {
  name: string;
  description: string;
  when_to_use: string;
  rules: string[];
  output_format: any;
};

export type SkillsConfig = {
  skills: Skill[];
};

const SKILLS_PATH = path.join(process.cwd(), "src/skills/skills.json");

export function loadSkills(): SkillsConfig {
  try {
    const data = fs.readFileSync(SKILLS_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return { skills: [] };
  }
}

export function buildSystemPrompt(skills: Skill[]): string {
  if (skills.length === 0) {
    return "You are a helpful assistant.";
  }

  const skillsSection = skills
    .map(
      (s, i) => `
Skill ${i + 1}: ${s.name}
Description: ${s.description}
When to use: ${s.when_to_use}
Rules:
${s.rules.map((r) => `- ${r}`).join("\n")}
Output format: ${JSON.stringify(s.output_format)}
`
    )
    .join("\n---\n");

  return `
You are a helpful assistant with access to the following skills:

${skillsSection}

Follow the instructions for each skill when relevant. Use the appropriate skill based on the user's request.
`.trim();
}
