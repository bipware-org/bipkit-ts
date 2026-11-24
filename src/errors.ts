export interface BipkitErrorOptions {
  status?: number;
  requestId?: string | null;
  body?: unknown;
}

export class BipkitError extends Error {
  readonly status?: number;
  readonly requestId?: string | null;
  readonly body?: unknown;

  constructor(message: string, options: BipkitErrorOptions = {}) {
    super(message);
    this.name = new.target.name;
    this.status = options.status;
    this.requestId = options.requestId ?? null;
    this.body = options.body;
  }
}

export class APIConnectionError extends BipkitError {}
export class APITimeoutError extends APIConnectionError {}
export class APIStatusError extends BipkitError {}
export class AuthenticationError extends APIStatusError {}
export class PermissionError extends APIStatusError {}
export class NotFoundError extends APIStatusError {}
export class ValidationError extends APIStatusError {}
export class InternalServerError extends APIStatusError {}

export class RateLimitError extends APIStatusError {
  readonly retryAfter?: number | null;

  constructor(message: string, options: BipkitErrorOptions & { retryAfter?: number | null } = {}) {
    super(message, options);
    this.retryAfter = options.retryAfter ?? null;
  }
}
