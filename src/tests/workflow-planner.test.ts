import { describe, it, expect } from "vitest";
import { runWithSkills } from "../agent/skills";

function extractJSON(str: string): any {
  const start = str.indexOf("{");
  const end = str.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("No JSON found");
  }
  return JSON.parse(str.slice(start, end + 1));
}

describe("Workflow Automation Planner", () => {
  it("returns valid JSON with required fields", async () => {
    const result = await runWithSkills(
      "When someone submits a contact form send a Slack message and create a Notion page."
    );

    const parsed = extractJSON(result);

    expect(parsed).toHaveProperty("workflow_name");
    expect(parsed).toHaveProperty("description");
    expect(parsed).toHaveProperty("trigger");
    expect(parsed).toHaveProperty("actions");
    expect(parsed).toHaveProperty("diagram");
    expect(parsed).toHaveProperty("logic");
    expect(Array.isArray(parsed.actions)).toBe(true);
    expect(Array.isArray(parsed.logic)).toBe(true);
  }, 30000);

  it("includes exactly one trigger", async () => {
    const result = await runWithSkills(
      "When someone submits a contact form send a Slack message and create a Notion page."
    );

    const parsed = extractJSON(result);

    expect(parsed.trigger).toBeDefined();
    expect(parsed.trigger).toHaveProperty("type");
    expect(typeof parsed.trigger.type).toBe("string");
  }, 30000);

  it("includes at least one action", async () => {
    const result = await runWithSkills(
      "When someone submits a contact form send a Slack message and create a Notion page."
    );

    const parsed = extractJSON(result);

    expect(parsed.actions.length).toBeGreaterThan(0);
  }, 30000);

  it("generates a Mermaid diagram", async () => {
    const result = await runWithSkills(
      "When a new GitHub issue is created, send a Slack notification."
    );

    const parsed = extractJSON(result);

    expect(parsed.diagram).toBeDefined();
    expect(typeof parsed.diagram).toBe("string");
    expect(parsed.diagram).toContain("graph");
  }, 30000);

  it("handles GitHub issue trigger correctly", async () => {
    const result = await runWithSkills(
      "When a new GitHub issue is created, add it to a Google Sheet."
    );

    const parsed = extractJSON(result);

    expect(parsed.trigger.type).toBe("github.issue_created");
    expect(parsed.workflow_name.toLowerCase()).toContain("github");
  }, 30000);

  it("handles email trigger with condition", async () => {
    const result = await runWithSkills(
      "When an email is received, if it contains 'urgent', send an SMS alert."
    );

    const parsed = extractJSON(result);

    expect(parsed.trigger.type).toBe("email.received");
    expect(parsed.logic.length).toBeGreaterThan(0);
    expect(parsed.logic[0].type).toBe("condition.if");
  }, 30000);

  it("handles Stripe payment trigger", async () => {
    const result = await runWithSkills(
      "When a Stripe payment succeeds, send a thank you email."
    );

    const parsed = extractJSON(result);

    expect(parsed.trigger.type).toBe("stripe.payment_succeeded");
  }, 30000);

  it("includes proper action types", async () => {
    const result = await runWithSkills(
      "When form submitted, send Slack message and create Notion page."
    );

    const parsed = extractJSON(result);

    const actionTypes = parsed.actions.map((a: any) => a.action || a.type);
    expect(actionTypes).toContain("slack.send_message");
    expect(actionTypes).toContain("notion.create_page");
  }, 30000);
});
