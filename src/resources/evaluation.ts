import type { Transport } from "../transport.js";
import type { CustomerFeedbackRequest, CustomerFeedbackResponse } from "../types/index.js";

export class FeedbackResource {
  constructor(private readonly transport: Transport) {}

  submit(req: CustomerFeedbackRequest): Promise<CustomerFeedbackResponse> {
    return this.transport.request<CustomerFeedbackResponse>("POST", "/api/v1/feedback", {
      body: req,
    });
  }
}
