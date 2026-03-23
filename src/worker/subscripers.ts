import { ActionPlan } from "../types/agent.types.js";
import { sendEmailMessage } from "../services/emailService.js";

export async function hitUrl(
  actionPlan: ActionPlan,
  subscriber: HttpSubscriper,
) {
  const payload = extractPlanPayload(actionPlan);
  try {
    const response = await fetch(subscriber.config.url, {
      method: subscriber.config.method,
      headers: subscriber.config.headers ?? undefined,
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      return false;
    }
  } catch (error) {
    console.error("Agent error", error);
    return false;
  }

  return true;
}

export async function sendSlackMessage(
  actionPlan: ActionPlan,
  subscriber: SlackSubscriper,
) {
  const response = await fetch(subscriber.config.webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: actionPlan.result.body,
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    console.error("Slack error:", text);
    return false;
  }
  return true;
}

export async function sendEmail(
  actionPlan: ActionPlan,
  subscriber: EmailSubscriper,
) {
  if (!subscriber.config.to) {
    throw new Error("Email subscriber must include a recipient");
  }

  try {
    const payload = extractPlanPayload(actionPlan);
    const serializedPayload = JSON.stringify(payload ?? {}, null, 2);
    const textBody = subscriber.config.text ?? serializedPayload;
    const htmlBody =
      subscriber.config.html ??
      `<pre style="font-family:monospace;white-space:pre-wrap">${escapeHtml(serializedPayload)}</pre>`;

    const info = await sendEmailMessage({
      from: subscriber.config.from ?? getDefaultFromAddress(),
      to: subscriber.config.to,
      cc: subscriber.config.cc,
      bcc: subscriber.config.bcc,
      subject: subscriber.config.subject ?? "Automation notification",
      text: textBody,
      html: htmlBody,
      category: subscriber.config.category,
    });

    return info.rejected.length === 0;
  } catch (error) {
    console.error("Agent error", error);
    if (error instanceof Error) {
      throw error;
    }
    return false;
  }
}

function getDefaultFromAddress() {
  const candidateKeys = [
    "BREVO_SENDER_EMAIL",
    "BREVO_SENDER",
    "EMAIL_FROM",
    "MAILTRAP_SENDER",
    "MAILTRAP_SENDER_EMAIL",
    "SMTP_FROM",
    "SMTP_USER",
  ];
  for (const key of candidateKeys) {
    const value = process.env[key];
    if (value) {
      return value;
    }
  }
  throw new Error(
    "BREVO_SENDER_EMAIL, BREVO_SENDER, EMAIL_FROM, MAILTRAP_SENDER, MAILTRAP_SENDER_EMAIL, SMTP_FROM or SMTP_USER environment variable must be configured",
  );
}

function extractPlanPayload(actionPlan: ActionPlan) {
  const planResult = (actionPlan as { result?: unknown }).result;

  if (Array.isArray(planResult) && planResult.length > 0) {
    const firstResult = planResult[0];
    if (firstResult && typeof firstResult === "object") {
      if ("body" in firstResult) {
        return (firstResult as { body?: unknown }).body ?? firstResult;
      }
    }
    return firstResult ?? {};
  }

  if (planResult && typeof planResult === "object" && "body" in planResult) {
    return (planResult as { body?: unknown }).body ?? planResult;
  }

  return planResult ?? {};
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
