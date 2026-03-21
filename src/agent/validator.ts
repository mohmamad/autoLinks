import { ActionPlan } from "../types/agent.types.js";

const supportedHttpMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export function validateActionPlan(plan: ActionPlan) {
  const diagram = plan.diagram?.trim();
  if (!diagram) {
    throw new Error("Action plan must include a Mermaid diagram");
  }

  if (!diagram.toLowerCase().startsWith("graph")) {
    throw new Error("Diagram must start with graph keyword");
  }

  if (!Array.isArray(plan.result) || plan.result.length === 0) {
    throw new Error("Action must define at least one execution result");
  }

  return true;
}
