import { ActionPlan } from "../types/agent.types.js";

const supportedHttpMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export function validateActionPlan(plan: ActionPlan) {
  if (!plan.action_name?.trim()) {
    throw new Error("Action must include an action_name");
  }

  if (!plan.description?.trim()) {
    throw new Error("Action must include a description");
  }

  if (!Array.isArray(plan.inputs) || plan.inputs.length === 0) {
    throw new Error("Action must define at least one input data source");
  }

  for (const input of plan.inputs) {
    if (!input.id?.trim()) {
      throw new Error("Each input must include an id");
    }
    if (!input.description?.trim()) {
      throw new Error("Each input must include a description");
    }
    if (!input.url?.trim()) {
      throw new Error("Each input must include a url");
    }
    if (!input.method?.trim()) {
      throw new Error("Each input must include an HTTP method");
    }
    if (!supportedHttpMethods.includes(input.method.toUpperCase())) {
      throw new Error(`Unsupported input method: ${input.method}`);
    }
  }

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

  for (const entry of plan.result) {
    if (!entry.url?.trim()) {
      throw new Error("Each result entry must include a url");
    }
    if (entry.url === "direct_response") {
      throw new Error("Result entries must contain actionable URLs, not direct_response placeholders");
    }
    if (!entry.method?.trim()) {
      throw new Error("Each result entry must include an HTTP method");
    }
    if (!supportedHttpMethods.includes(entry.method.toUpperCase())) {
      throw new Error(`Unsupported result method: ${entry.method}`);
    }
    if (!entry.body || typeof entry.body !== "object") {
      throw new Error("Each result entry must include a body payload");
    }

    if (entry.url.includes("gmail.googleapis.com")) {
      const { to, subject, message } = entry.body as Record<string, unknown>;
      if (!to || typeof to !== "string") {
        throw new Error("Gmail results must include a 'to' field with the recipient email");
      }
      if (!subject || typeof subject !== "string") {
        throw new Error("Gmail results must include a 'subject' field");
      }
      if (!message || typeof message !== "string") {
        throw new Error("Gmail results must include a 'message' field containing the plain text");
      }
    }
  }

  return true;
}
