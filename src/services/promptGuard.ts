import { BadRequestError } from "../api/errors.js";
import type { ActionPlan } from "../types/agent.types.js";

const PROMPT_MAX_CHARS = Number(process.env.PROMPT_MAX_CHARS ?? 4000);

const PROMPT_DENY_PATTERNS = [
  /(?:ignore|disregard|forget)\s+(?:all\s+)?(?:previous|above|earlier)\s+(?:instructions|guidelines|rules)/i,
  /(?:rm\s+-rf|drop\s+table|shutdown\s+-h|format\s+c:)/i,
  /\b(?:bash|powershell)\b.*(?:curl|wget)/i,
  /https?:\/\/(?:127\.0\.0\.1|0\.0\.0\.0|localhost|169\.254\.\d+\.\d+)/i,
];

const RESULT_DENY_PATTERNS = [
  /rm\s+-rf/i,
  /drop\s+table/i,
  /https?:\/\/(?:127\.0\.0\.1|0\.0\.0\.0|localhost|169\.254\.\d+\.\d+)/i,
];

export function assertPromptSafe(prompt: string) {
  const normalized = prompt.trim();
  if (normalized.length === 0) {
    throw new BadRequestError("Prompt cannot be empty");
  }
  if (normalized.length > PROMPT_MAX_CHARS) {
    throw new BadRequestError("Prompt is too long");
  }
  if (PROMPT_DENY_PATTERNS.some((pattern) => pattern.test(normalized))) {
    throw new BadRequestError("Prompt rejected due to unsafe instructions");
  }
}

export function assertActionPlanSafe(plan: ActionPlan) {
  const serializedBody = JSON.stringify(plan.result ?? {});
  const diagram = plan.diagram ?? "";
  if (
    RESULT_DENY_PATTERNS.some(
      (pattern) => pattern.test(serializedBody) || pattern.test(diagram ?? ""),
    )
  ) {
    throw new BadRequestError("Generated action plan contains unsafe content");
  }
}
