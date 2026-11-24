import type { DecisionResponse, EvaluateResponse } from "./types/index.js";

const TIER_RANK: Record<string, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

export interface EscalationOptions {
  minConfidenceTier?: "low" | "medium" | "high";
  maxEntropy?: number;
  minMargin?: number;
}

export function shouldEscalate(
  response: DecisionResponse | EvaluateResponse,
  options: EscalationOptions = {}
): boolean {
  const requiredRank = TIER_RANK[options.minConfidenceTier ?? "medium"] ?? 1;

  if ("decisions" in response) {
    const top = response.decisions[0];
    if (!top) return true;
    if ((TIER_RANK[top.confidence_tier.toLowerCase()] ?? 0) < requiredRank) return true;
    if (options.maxEntropy !== undefined && response.uncertainty_entropy > options.maxEntropy) {
      return true;
    }
    if (options.minMargin !== undefined && (top.margin == null || top.margin < options.minMargin)) {
      return true;
    }
    return false;
  }

  const values = Object.values(response.results ?? {});
  if (values.length === 0) return true;
  for (const item of values) {
    const tier = typeof item.confidence_tier === "string" ? item.confidence_tier.toLowerCase() : "";
    if (tier && (TIER_RANK[tier] ?? 0) < requiredRank) return true;
    if (
      options.maxEntropy !== undefined &&
      typeof item.uncertainty_entropy === "number" &&
      item.uncertainty_entropy > options.maxEntropy
    ) {
      return true;
    }
    if (
      options.minMargin !== undefined &&
      typeof item.margin === "number" &&
      item.margin < options.minMargin
    ) {
      return true;
    }
  }
  return false;
}
