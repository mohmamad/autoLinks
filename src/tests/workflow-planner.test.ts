// import { describe, it, expect } from "vitest";
// import { runWithSkills } from "../agent/skills";

// type Workflow = {
//   workflow_name: string;
//   description: string;
//   trigger: { type: string };
//   actions: Array<{ action?: string; type?: string }>;
//   logic: Array<{ type: string }>;
//   diagram: string;
// };

// describe("Workflow Automation Planner", () => {
//   it("returns valid JSON with required fields", async () => {
//     const parsed = await runWithSkills(
//       "When someone submits a contact form send a Slack message and create a Notion page."
//     ) as Workflow;

//     expect(parsed).toHaveProperty("workflow_name");
//     expect(parsed).toHaveProperty("description");
//     expect(parsed).toHaveProperty("trigger");
//     expect(parsed).toHaveProperty("actions");
//     expect(parsed).toHaveProperty("diagram");
//     expect(parsed).toHaveProperty("logic");
//     expect(Array.isArray(parsed.actions)).toBe(true);
//     expect(Array.isArray(parsed.logic)).toBe(true);
//   }, 30000);

//   it("includes exactly one trigger", async () => {
//     const parsed = await runWithSkills(
//       "When someone submits a contact form send a Slack message and create a Notion page."
//     ) as Workflow;

//     expect(parsed.trigger).toBeDefined();
//     expect(parsed.trigger).toHaveProperty("type");
//     expect(typeof parsed.trigger.type).toBe("string");
//   }, 30000);

//   it("includes at least one action", async () => {
//     const parsed = await runWithSkills(
//       "When someone submits a contact form send a Slack message and create a Notion page."
//     ) as Workflow;

//     expect(parsed.actions.length).toBeGreaterThan(0);
//   }, 30000);

//   it("generates a Mermaid diagram", async () => {
//     const parsed = await runWithSkills(
//       "When a new GitHub issue is created, send a Slack notification."
//     ) as Workflow;

//     expect(parsed.diagram).toBeDefined();
//     expect(typeof parsed.diagram).toBe("string");
//     expect(parsed.diagram).toContain("graph");
//   }, 30000);

//   it("handles GitHub issue trigger correctly", async () => {
//     const parsed = await runWithSkills(
//       "When a new GitHub issue is created, add it to a Google Sheet."
//     ) as Workflow;

//     expect(parsed.trigger.type).toBe("github.issue_created");
//     expect(parsed.workflow_name.toLowerCase()).toContain("github");
//   }, 30000);

//   it("handles email trigger with condition", async () => {
//     const parsed = await runWithSkills(
//       "When an email is received, if it contains 'urgent', send an SMS alert."
//     ) as Workflow;

//     expect(parsed.trigger.type).toBe("email.received");
//     expect(parsed.logic.length).toBeGreaterThan(0);
//     expect(parsed.logic[0].type).toBe("condition.if");
//   }, 30000);

//   it("handles Stripe payment trigger", async () => {
//     const parsed = await runWithSkills(
//       "When a Stripe payment succeeds, send a thank you email."
//     ) as Workflow;

//     expect(parsed.trigger.type).toBe("stripe.payment_succeeded");
//   }, 30000);

//   it("includes proper action types", async () => {
//     const parsed = await runWithSkills(
//       "When form submitted, send Slack message and create Notion page."
//     ) as Workflow;

//     const actionTypes = parsed.actions.map((a) => a.action || a.type);
//     expect(actionTypes).toContain("slack.send_message");
//     expect(actionTypes).toContain("notion.create_page");
//   }, 30000);
// });
