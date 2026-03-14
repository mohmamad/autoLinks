import "dotenv/config";

type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
};

const httpMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const tools = [
  {
    type: "function",
    function: {
      name: "http_request",
      description:
        "Call an HTTP endpoint to retrieve or submit data. Use this to read the latest values from user-provided APIs before producing the final result.",
      parameters: {
        type: "object",
        properties: {
          method: {
            type: "string",
            enum: httpMethods,
            description: "HTTP method in uppercase.",
          },
          url: {
            type: "string",
            description: "Fully qualified URL to call.",
          },
          headers: {
            type: "object",
            description: "Optional HTTP headers to include in the request.",
            additionalProperties: { type: "string" },
          },
          body: {
            type: "object",
            description: "Optional JSON payload for non-GET requests.",
            additionalProperties: true,
          },
        },
        required: ["method", "url"],
      },
    },
  },
];

export async function callLLM(
  messageOrMessages: string | ChatMessage[]
): Promise<string> {
  const convo: ChatMessage[] = Array.isArray(messageOrMessages)
    ? [...messageOrMessages]
    : [{ role: "user", content: messageOrMessages }];

  while (true) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: convo,
        tools,
        tool_choice: "auto",
        max_tokens: 4096,
      }),
    });

    const data = await res.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const choice = data.choices?.[0];
    const message = choice?.message;

    if (!message) {
      throw new Error("LLM returned no message");
    }

    if (message.tool_calls?.length) {
      convo.push({
        role: "assistant",
        content: message.content || "",
        tool_calls: message.tool_calls,
      });

      for (const toolCall of message.tool_calls as ToolCall[]) {
        const toolResult = await executeTool(toolCall);
        convo.push({
          role: "tool",
          content: toolResult,
          tool_call_id: toolCall.id,
        });
      }
      continue;
    }

    if (typeof message.content === "string") {
      return message.content;
    }

    throw new Error("LLM returned unsupported message format");
  }
}

async function executeTool(toolCall: ToolCall): Promise<string> {
  switch (toolCall.function.name) {
    case "http_request":
      return httpRequest(toolCall.function.arguments);
    default:
      throw new Error(`Unsupported tool: ${toolCall.function.name}`);
  }
}

async function httpRequest(rawArgs: string): Promise<string> {
  const args = JSON.parse(rawArgs || "{}");
  const { method, url, headers = {}, body } = args;

  if (!method || !httpMethods.includes(method)) {
    throw new Error("Invalid HTTP method supplied to http_request tool");
  }

  if (!url) {
    throw new Error("Missing URL for http_request tool");
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body:
        method === "GET" || method === "DELETE"
          ? undefined
          : body
          ? JSON.stringify(body)
          : undefined,
    });

    const contentType = response.headers.get("content-type") || "";
    const text = await response.text();
    let parsed: unknown = null;

    if (contentType.includes("application/json")) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }
    }

    const serialized = JSON.stringify({
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: parsed ?? truncate(text),
    });

    return serialized;
  } catch (error) {
    return JSON.stringify({
      status: null,
      statusText: "network_error",
      headers: {},
      body: {
        error: true,
        message: error instanceof Error ? error.message : "Unknown fetch error",
        url,
      },
    });
  }
}

function truncate(value: string, max = 4000): string {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max)}... [truncated]`;
}
