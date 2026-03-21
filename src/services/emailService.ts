import { config } from "../config.js";

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export type EmailMessageOptions = {
  from: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  category?: string;
};

export type EmailSendResult = {
  rejected: string[];
};

export async function sendEmailMessage(
  options: EmailMessageOptions,
): Promise<EmailSendResult> {
  const apiKey = config.brevo.apiKey;
  const payload = buildBrevoPayload(options);

  const response = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await safeReadResponse(response);
    throw new Error(
      `Brevo email failed: ${response.status} ${response.statusText} ${errorBody}`,
    );
  }

  return { rejected: [] };
}

function buildBrevoPayload(options: EmailMessageOptions) {
  const sender = parseAddress(options.from);
  const toRecipients = normalizeRecipients(options.to);
  const ccRecipients = normalizeRecipients(options.cc);
  const bccRecipients = normalizeRecipients(options.bcc);

  if (!toRecipients || toRecipients.length === 0) {
    throw new Error("At least one email recipient must be provided");
  }

  const payload: Record<string, unknown> = {
    sender,
    to: toRecipients,
    subject: options.subject,
  };

  if (ccRecipients) {
    payload.cc = ccRecipients;
  }
  if (bccRecipients) {
    payload.bcc = bccRecipients;
  }
  if (options.text) {
    payload.textContent = options.text;
  }
  if (options.html) {
    payload.htmlContent = options.html;
  }
  if (options.category) {
    payload.tags = [options.category];
  }

  return payload;
}

function normalizeRecipients(value?: string | string[]) {
  if (!value) {
    return undefined;
  }
  const values = Array.isArray(value)
    ? value
    : value
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
  if (values.length === 0) {
    return undefined;
  }
  return values.map(parseAddress);
}

function parseAddress(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(.*)<([^>]+)>$/);
  if (match) {
    const name = match[1].trim().replace(/^"|"$/g, "");
    return {
      email: match[2].trim(),
      ...(name ? { name } : {}),
    };
  }
  return { email: trimmed };
}

async function safeReadResponse(response: Response) {
  try {
    const text = await response.text();
    return text;
  } catch {
    return "";
  }
}
