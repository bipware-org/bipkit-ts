import type { Transport } from "../transport.js";
import type { EngineStatusModel } from "../types/index.js";

export class EnginesResource {
  constructor(private readonly transport: Transport) {}

  list(): Promise<EngineStatusModel[]> {
    return this.transport.request<EngineStatusModel[]>("GET", "/api/v1/engines");
  }
}
