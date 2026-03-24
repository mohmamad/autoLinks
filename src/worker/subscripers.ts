import { ActionPlan } from "../types/agent.types.js";
import { sendEmailMessage } from "../services/emailService.js";

type SubscriberHandler = (
  actionPlan: ActionPlan,
  subscriber: any,
) => Promise<boolean>;

export function getSubscriberHandler(type: string): SubscriberHandler {
  const handlers: Record<string, SubscriberHandler> = {
    slack: sendSlackMessage,
    email: sendEmail,
    "http request": hitUrl,
  };

  const handler = handlers[type];

  if (!handler) {
    throw new Error(`Unsupported subscriber type: ${type}`);
  }

  return handler;
}

export async function hitUrl(
  actionPlan: ActionPlan,
  subscriber: HttpSubscriper,
): Promise<boolean> {
  const payload = extractPlanPayload(actionPlan);
  const method = subscriber.config.method.toUpperCase();

  try {
    const response = await fetch(subscriber.config.url, {
      method,
      headers: {
        ...(method !== "GET" ? { "Content-Type": "application/json" } : {}),
        ...(subscriber.config.headers ?? {}),
      },
      ...(method !== "GET" && payload !== undefined
        ? { body: JSON.stringify(payload) }
        : {}),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("HTTP error:", {
        status: response.status,
        body: text,
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error("Request failed:", error);
    return false;
  }
}

export async function sendSlackMessage(
  actionPlan: ActionPlan,
  subscriber: SlackSubscriper,
) {
  const payload = extractPlanPayload(actionPlan);

  await fetch(subscriber.config.webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: `${JSON.stringify(payload, null, 2)}`,
    }),
  });
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
