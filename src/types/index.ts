export interface CandidateModel {
  id: string;
  label?: string | null;
  description?: string | null;
}

export interface UsageModel {
  evaluations_count: number;
  state_tokens: number;
  evaluation_tokens: number;
  total_tokens: number;
  latency_ms?: number;
}

export interface EvaluateRequest {
  state: string;
  evaluations: Record<string, unknown>;
  engine?: string;
  temperature?: number | null;
}

export interface EvaluateResponse {
  request_id: string;
  state: string;
  engine: string;
  usage: UsageModel;
  results: Record<string, Record<string, unknown>>;
}

export interface DecisionRequest {
  state: string;
  choices: Array<CandidateModel | string>;
  engine?: string;
  top_k?: number | null;
  temperature?: number | null;
}

export interface DecisionItemModel {
  candidate_id: string;
  probability: number;
  confidence_tier: string;
  confidence_index: number;
  margin?: number | null;
}

export interface DecisionResponse {
  request_id: string;
  state: string;
  engine: string;
  uncertainty_entropy: number;
  top_choice?: string | null;
  decisions: DecisionItemModel[];
}

export interface CustomerFeedbackRequest {
  request_id: string;
  verified_decision: unknown;
  was_accurate: boolean;
  operator_notes?: string | null;
}

export interface CustomerFeedbackResponse {
  status: string;
  request_id: string;
  recorded_at: string;
}

export interface EngineStatusModel {
  name: string;
  tier: string;
  description: string;
  enabled?: boolean;
  status?: string;
  is_trained?: boolean | null;
  classes?: string[] | null;
}

export interface APIKeyInfo {
  id: string;
  name: string;
  key_prefix: string;
  environment: string;
  scopes: string[];
  is_active: boolean;
  last_used_at?: string | null;
  expires_at?: string | null;
  created_at: string;
}

export interface CreateAPIKeyRequest {
  name: string;
  environment?: string;
  scopes?: string[];
}

export interface CreateAPIKeyResponse {
  id: string;
  name: string;
  key: string;
  key_prefix: string;
  environment: string;
  scopes: string[];
  created_at: string;
}

export interface RotateAPIKeyRequest {
  grace_period_minutes?: number;
}

export interface RotateAPIKeyResponse {
  new_key: CreateAPIKeyResponse;
  rotated_key_id: string;
  previous_key_revoked_immediately: boolean;
  previous_key_expires_at?: string | null;
}

export interface UsageEngineBreakdown {
  engine: string;
  decisions?: number;
  evaluations?: number;
  tokens?: number;
}

export interface UsageSummaryResponse {
  organization_id: string;
  period_ym: string;
  plan_slug: string;
  plan_name: string;
  subscription_status: string;
  decisions_used: number;
  evaluations_used: number;
  total_tokens: number;
  monthly_limit: number;
  remaining_quota: number;
  avg_latency_ms: number;
  by_engine: UsageEngineBreakdown[];
}

export interface UsageTimeseriesPoint {
  date: string;
  decisions?: number;
  evaluations?: number;
  tokens?: number;
  avg_latency_ms?: number;
}

export interface UsageTimeseriesResponse {
  organization_id: string;
  days: number;
  points: UsageTimeseriesPoint[];
}

export interface RecordOutcomeRequest {
  request_id: string;
  output_name?: string | null;
  observed_effect: unknown;
}

export interface BatchRecordOutcomeRequest {
  items: RecordOutcomeRequest[];
}

export interface ExportBundleRequest {
  request_id: string;
  output_name?: string | null;
  presented_state?: string | null;
}

export interface DplBundle {
  schema_version?: string;
  record: Record<string, unknown>;
  state_disclosure?: Record<string, unknown> | null;
  outcome?: Record<string, unknown> | null;
  manifest: Record<string, unknown>;
  signature?: Record<string, unknown> | null;
}

export interface ProvenanceRecordsParams {
  status?: string;
  primitive_type?: string;
  execution_stage?: string;
  request_id?: string;
  from_seq?: number;
  to_seq?: number;
  limit?: number;
  offset?: number;
  order?: string;
}
