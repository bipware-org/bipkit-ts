import { APIKeysResource } from "./resources/api-keys.js";
import { EnginesResource } from "./resources/engines.js";
import { FeedbackResource } from "./resources/evaluation.js";
import { ProvenanceResource } from "./resources/provenance.js";
import { UsageResource } from "./resources/usage.js";
import { Transport, type TransportConfig } from "./transport.js";
import type {
  DecisionRequest,
  DecisionResponse,
  EvaluateRequest,
  EvaluateResponse,
} from "./types/index.js";

function readEnv(key: string): string | undefined {
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }
  return undefined;
}

export type BipkitOptions = TransportConfig;

export class Bipkit {
  private readonly transport: Transport;
  readonly feedback: FeedbackResource;
  readonly engines: EnginesResource;
  readonly apiKeys: APIKeysResource;
  readonly usage: UsageResource;
  readonly provenance: ProvenanceResource;

  constructor(options: BipkitOptions = {}) {
    this.transport = new Transport({
      ...options,
      apiKey: options.apiKey ?? readEnv("BIPKIT_API_KEY"),
      baseUrl: options.baseUrl ?? readEnv("BIPKIT_BASE_URL"),
    });
    this.feedback = new FeedbackResource(this.transport);
    this.engines = new EnginesResource(this.transport);
    this.apiKeys = new APIKeysResource(this.transport);
    this.usage = new UsageResource(this.transport);
    this.provenance = new ProvenanceResource(this.transport);
  }

  evaluate(req: EvaluateRequest): Promise<EvaluateResponse> {
    return this.transport.request<EvaluateResponse>("POST", "/api/v1/evaluate", {
      body: { engine: "bip-instant", ...req },
    });
  }

  decide(req: DecisionRequest): Promise<DecisionResponse> {
    return this.transport.request<DecisionResponse>("POST", "/api/v1/decide", {
      body: { engine: "bip-instant", ...req },
    });
  }

  health(): Promise<Record<string, unknown>> {
    return this.transport.request<Record<string, unknown>>("GET", "/api/v1/health", {
      requireAuth: false,
    });
  }
}
