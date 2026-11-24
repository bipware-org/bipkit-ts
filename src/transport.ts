import {
  APIConnectionError,
  APIStatusError,
  APITimeoutError,
  AuthenticationError,
  InternalServerError,
  NotFoundError,
  PermissionError,
  RateLimitError,
  ValidationError,
} from "./errors.js";
import { SDK_VERSION } from "./version.js";

export const DEFAULT_BASE_URL = "https://api.bipkit.io";
export const DEFAULT_TIMEOUT_MS = 30_000;
export const DEFAULT_MAX_RETRIES = 2;

const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);

export interface TransportConfig {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
  defaultHeaders?: Record<string, string>;
  fetch?: typeof globalThis.fetch;
}

export interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  requireAuth?: boolean;
  signal?: AbortSignal;
}

function parseRetryAfterMs(headers: Headers): number | null {
  const raw = headers.get("retry-after");
  if (!raw) return null;
  const seconds = Number(raw);
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  return Math.min(seconds * 1000, 60_000);
}

function computeBackoffMs(attempt: number, retryAfterMs: number | null): number {
  if (retryAfterMs !== null) return retryAfterMs;
  const base = 250 * 2 ** attempt;
  const jitter = Math.random() * 150;
  return Math.min(base + jitter, 15_000);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractMessage(status: number, body: unknown): string {
  if (body && typeof body === "object") {
    const obj = body as Record<string, unknown>;
    const detail = obj.detail ?? obj.message ?? obj.error;
    if (typeof detail === "string") return detail;
    if (detail !== undefined) return JSON.stringify(detail);
  }
  if (typeof body === "string" && body.trim()) return body.trim();
  return `HTTP ${status}`;
}

function throwForStatus(status: number, headers: Headers, body: unknown): never {
  const message = extractMessage(status, body);
  const requestId = headers.get("x-request-id");
  const opts = { status, requestId, body };

  if (status === 401) throw new AuthenticationError(message, opts);
  if (status === 403) throw new PermissionError(message, opts);
  if (status === 404) throw new NotFoundError(message, opts);
  if (status === 422) throw new ValidationError(message, opts);
  if (status === 429) {
    const retryMs = parseRetryAfterMs(headers);
    throw new RateLimitError(message, {
      ...opts,
      retryAfter: retryMs !== null ? retryMs / 1000 : null,
    });
  }
  if (status >= 500) throw new InternalServerError(message, opts);
  throw new APIStatusError(message, opts);
}

export class Transport {
  private readonly apiKey?: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly defaultHeaders: Record<string, string>;
  private readonly fetchImpl: typeof globalThis.fetch;

  constructor(config: TransportConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = Math.max(0, config.maxRetries ?? DEFAULT_MAX_RETRIES);
    this.defaultHeaders = { ...(config.defaultHeaders ?? {}) };
    this.fetchImpl = config.fetch ?? globalThis.fetch;
  }

  async request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
    const requireAuth = options.requireAuth ?? true;
    const headers: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": `bipkit-ts/${SDK_VERSION}`,
      ...this.defaultHeaders,
    };

    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    } else if (requireAuth) {
      throw new AuthenticationError(
        "Missing Bipkit API key. Pass apiKey in constructor or set BIPKIT_API_KEY.",
        { status: 401 }
      );
    }

    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const url = new URL(`${this.baseUrl}${path}`);
    if (options.params) {
      for (const [k, v] of Object.entries(options.params)) {
        if (v !== undefined && v !== null) {
          url.searchParams.set(k, String(v));
        }
      }
    }

    let lastError: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
      const onExternalAbort = () => controller.abort();
      options.signal?.addEventListener("abort", onExternalAbort, { once: true });

      try {
        const response = await this.fetchImpl(url.toString(), {
          method,
          headers,
          body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        options.signal?.removeEventListener("abort", onExternalAbort);

        if (RETRYABLE_STATUSES.has(response.status) && attempt < this.maxRetries) {
          const backoff = computeBackoffMs(attempt, parseRetryAfterMs(response.headers));
          await sleep(backoff);
          continue;
        }

        const parsed = await parseBody(response);
        if (!response.ok) {
          throwForStatus(response.status, response.headers, parsed);
        }
        return parsed as T;
      } catch (err) {
        clearTimeout(timeoutId);
        options.signal?.removeEventListener("abort", onExternalAbort);

        if (err instanceof APIStatusError) {
          throw err;
        }
        const isAbort = err instanceof Error && err.name === "AbortError";
        lastError = isAbort
          ? new APITimeoutError(`Request timed out after ${this.timeoutMs}ms`)
          : new APIConnectionError(`Connection error: ${String(err)}`);

        if (attempt < this.maxRetries) {
          await sleep(computeBackoffMs(attempt, null));
          continue;
        }
        throw lastError;
      }
    }

    throw lastError ?? new APIConnectionError("Request failed after retries");
  }
}
