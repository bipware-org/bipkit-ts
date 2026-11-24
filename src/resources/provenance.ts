import type { Transport } from "../transport.js";
import type {
  BatchRecordOutcomeRequest,
  DplBundle,
  ExportBundleRequest,
  ProvenanceRecordsParams,
  RecordOutcomeRequest,
} from "../types/index.js";

export class ProvenanceResource {
  constructor(private readonly transport: Transport) {}

  manifest(): Promise<Record<string, unknown>> {
    return this.transport.request("GET", "/api/v1/provenance/manifest", { requireAuth: false });
  }

  calibration(): Promise<Record<string, unknown>> {
    return this.transport.request("GET", "/api/v1/provenance/calibration", { requireAuth: false });
  }

  keys(): Promise<Record<string, unknown>> {
    return this.transport.request("GET", "/api/v1/provenance/keys", { requireAuth: false });
  }

  recordOutcome(req: RecordOutcomeRequest): Promise<Record<string, unknown>> {
    return this.transport.request("POST", "/api/v1/provenance/outcomes", { body: req });
  }

  recordOutcomesBatch(req: BatchRecordOutcomeRequest): Promise<Record<string, unknown>> {
    return this.transport.request("POST", "/api/v1/provenance/outcomes/batch", { body: req });
  }

  chain(params: { from_seq?: number; limit?: number } = {}): Promise<Record<string, unknown>> {
    return this.transport.request("GET", "/api/v1/provenance/chain", { params });
  }

  metrics(): Promise<Record<string, unknown>> {
    return this.transport.request("GET", "/api/v1/provenance/metrics");
  }

  records(params: ProvenanceRecordsParams = {}): Promise<Record<string, unknown>> {
    return this.transport.request("GET", "/api/v1/provenance/records", {
      params: params as Record<string, string | number | undefined>,
    });
  }

  getRecord(entryId: string): Promise<Record<string, unknown>> {
    return this.transport.request(
      "GET",
      `/api/v1/provenance/records/${encodeURIComponent(entryId)}`
    );
  }

  getRequest(requestId: string): Promise<Record<string, unknown>> {
    return this.transport.request(
      "GET",
      `/api/v1/provenance/requests/${encodeURIComponent(requestId)}`
    );
  }

  export(req: ExportBundleRequest): Promise<Record<string, unknown>> {
    return this.transport.request("POST", "/api/v1/provenance/export", { body: req });
  }

  verify(bundle: DplBundle): Promise<Record<string, unknown>> {
    return this.transport.request("POST", "/api/v1/provenance/verify", { body: bundle });
  }
}
