import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { BadRequestError } from "../api/errors.js";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export type HttpRequestOptions = {
  url: string;
  method?: HttpMethod;
  headers?: Record<string, string | undefined> | undefined;
  body?: string;
  timeoutMs?: number;
};

type IPv4Range = {
  type: 4;
  base: number;
  mask: number;
};

type IPv6Range = {
  type: 6;
  base: bigint;
  mask: number;
};

const BLOCKED_IPV4_RANGES: IPv4Range[] = buildIpv4Ranges([
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 3],
  ["240.0.0.0", 4],
]);

const BLOCKED_IPV6_RANGES: IPv6Range[] = buildIpv6Ranges([
  ["::", 128],
  ["::1", 128],
  ["::ffff:0:0", 96],
  ["fc00::", 7],
  ["fe80::", 10],
  ["fec0::", 10],
  ["ff00::", 8],
]);

const ALLOWED_METHODS = new Set<HttpMethod>(["GET", "POST", "PUT", "DELETE"]);
const DEFAULT_TIMEOUT_MS = Number(process.env.HTTP_CLIENT_TIMEOUT_MS ?? 10000);

export async function assertUrlAllowed(url: string) {
  const requestUrl = new URL(url);
  if (!/^https?:$/.test(requestUrl.protocol)) {
    throw new BadRequestError("Only HTTP/HTTPS protocols are allowed");
  }
  await ensureHostAllowed(requestUrl.hostname);
}

export async function safeHttpRequest(options: HttpRequestOptions) {
  await assertUrlAllowed(options.url);
  const requestUrl = new URL(options.url);

  const method = (options.method ?? "POST").toUpperCase() as HttpMethod;
  if (!ALLOWED_METHODS.has(method)) {
    throw new BadRequestError(`HTTP method ${method} is not allowed`);
  }

  const sanitizedHeaders: Record<string, string> = {};
  if (options.headers) {
    for (const [key, value] of Object.entries(options.headers)) {
      if (!value) continue;
      const lowerKey = key.toLowerCase();
      if (["host", "connection"].includes(lowerKey)) {
        continue;
      }
      sanitizedHeaders[key] = value;
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  try {
    return await fetch(requestUrl.toString(), {
      method,
      headers: sanitizedHeaders,
      body: options.body,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function ensureHostAllowed(hostname: string) {
  const ipType = isIP(hostname);
  if (ipType === 4 || ipType === 6) {
    if (isBlockedAddress(hostname)) {
      throw new Error("Outbound HTTP host is not permitted");
    }
    return;
  }

  const records = await lookup(hostname, { all: true });
  if (!records.length) {
    throw new Error(`Unable to resolve host ${hostname}`);
  }
  for (const record of records) {
    if (isBlockedAddress(record.address)) {
      throw new Error(
        `Outbound HTTP host ${hostname} resolves to a disallowed network`,
      );
    }
  }
}

function isBlockedAddress(address: string) {
  const ipType = isIP(address);
  if (ipType === 4) {
    const numeric = ipv4ToNumber(address);
    return BLOCKED_IPV4_RANGES.some((range) =>
      isIpv4InRange(numeric, range.base, range.mask),
    );
  }
  if (ipType === 6) {
    const numeric = ipv6ToBigInt(address);
    return BLOCKED_IPV6_RANGES.some((range) =>
      isIpv6InRange(numeric, range.base, range.mask),
    );
  }
  return false;
}

function ipv4ToNumber(ip: string) {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + Number(octet), 0);
}

function buildIpv4Ranges(
  ranges: Array<[base: string, mask: number]>,
): IPv4Range[] {
  return ranges.map(([base, mask]) => ({
    type: 4,
    base: ipv4ToNumber(base),
    mask,
  }));
}

function ipv6ToBigInt(ip: string) {
  const [head, tail] = ip.split("::");
  const headParts = head ? head.split(":").filter(Boolean) : [];
  const tailParts = tail ? tail.split(":").filter(Boolean) : [];
  const missing = 8 - (headParts.length + tailParts.length);
  const baseParts = [
    ...headParts,
    ...Array(Math.max(missing, 0)).fill("0"),
    ...tailParts,
  ];

  const expandedParts: string[] = [];
  for (const part of baseParts) {
    if (part.includes(".")) {
      const ipv4Segments = part
        .split(".")
        .filter(Boolean)
        .map((segment: string) => Number(segment));
      if (ipv4Segments.length === 4) {
        expandedParts.push(
          ((ipv4Segments[0] << 8) | ipv4Segments[1]).toString(16),
        );
        expandedParts.push(
          ((ipv4Segments[2] << 8) | ipv4Segments[3]).toString(16),
        );
        continue;
      }
    }
    expandedParts.push(part === "" ? "0" : part);
  }

  while (expandedParts.length < 8) {
    expandedParts.push("0");
  }

  return expandedParts.reduce((acc, part) => {
    const value = parseInt(part, 16);
    return (acc << 16n) + BigInt(Number.isNaN(value) ? 0 : value);
  }, 0n);
}

function buildIpv6Ranges(
  ranges: Array<[base: string, mask: number]>,
): IPv6Range[] {
  return ranges.map(([base, mask]) => ({
    type: 6,
    base: ipv6ToBigInt(base),
    mask,
  }));
}

const FULL_MASK_32 = (1n << 32n) - 1n;

function isIpv4InRange(value: number, base: number, mask: number) {
  if (mask === 0) {
    return true;
  }
  const valueBig = BigInt(value) & FULL_MASK_32;
  const baseBig = BigInt(base) & FULL_MASK_32;
  const maskBig =
    (((1n << BigInt(mask)) - 1n) << BigInt(32 - mask)) & FULL_MASK_32;
  return (valueBig & maskBig) === (baseBig & maskBig);
}

function isIpv6InRange(value: bigint, base: bigint, mask: number) {
  if (mask === 0) {
    return true;
  }
  const shift = 128 - mask;
  return value >> BigInt(shift) === base >> BigInt(shift);
}
