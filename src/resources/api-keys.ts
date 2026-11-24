import type { Transport } from "../transport.js";
import type {
  APIKeyInfo,
  CreateAPIKeyRequest,
  CreateAPIKeyResponse,
  RotateAPIKeyRequest,
  RotateAPIKeyResponse,
} from "../types/index.js";

export class APIKeysResource {
  constructor(private readonly transport: Transport) {}

  list(): Promise<APIKeyInfo[]> {
    return this.transport.request<APIKeyInfo[]>("GET", "/api/v1/api-keys");
  }

  create(req: CreateAPIKeyRequest): Promise<CreateAPIKeyResponse> {
    return this.transport.request<CreateAPIKeyResponse>("POST", "/api/v1/api-keys", {
      body: req,
    });
  }

  rotate(keyId: string, req: RotateAPIKeyRequest = {}): Promise<RotateAPIKeyResponse> {
    return this.transport.request<RotateAPIKeyResponse>(
      "POST",
      `/api/v1/api-keys/${encodeURIComponent(keyId)}/rotate`,
      { body: req }
    );
  }

  revoke(keyId: string): Promise<Record<string, unknown>> {
    return this.transport.request<Record<string, unknown>>(
      "DELETE",
      `/api/v1/api-keys/${encodeURIComponent(keyId)}`
    );
  }
}
