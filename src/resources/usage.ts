import type { Transport } from "../transport.js";
import type { UsageSummaryResponse, UsageTimeseriesResponse } from "../types/index.js";

export class UsageResource {
  constructor(private readonly transport: Transport) {}

  summary(): Promise<UsageSummaryResponse> {
    return this.transport.request<UsageSummaryResponse>("GET", "/api/v1/usage/summary");
  }

  timeseries(params: { days?: number } = {}): Promise<UsageTimeseriesResponse> {
    return this.transport.request<UsageTimeseriesResponse>("GET", "/api/v1/usage/timeseries", {
      params: { days: params.days },
    });
  }
}
