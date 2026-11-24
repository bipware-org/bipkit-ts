import assert from "node:assert/strict";
import test from "node:test";
import {
  AuthenticationError,
  Bipkit,
  RateLimitError,
  shouldEscalate,
} from "../dist/index.js";

function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

test("Bipkit TS SDK covers all public resources and decision-safety", async () => {
  const seen = [];
  const mockFetch = async (url, init) => {
    const parsed = new URL(url);
    seen.push(`${init.method} ${parsed.pathname}`);
    if (parsed.pathname === "/api/v1/health") return jsonResponse({ status: "ok" });
    if (parsed.pathname === "/api/v1/decide") {
      return jsonResponse({
        request_id: "req_1",
        state: "refund",
        engine: "bip-cascade",
        uncertainty_entropy: 0.1,
        top_choice: "billing",
        decisions: [
          {
            candidate_id: "billing",
            probability: 0.94,
            confidence_tier: "high",
            confidence_index: 0.95,
            margin: 0.88,
          },
        ],
      });
    }
    if (parsed.pathname === "/api/v1/evaluate") {
      return jsonResponse({
        request_id: "req_2",
        state: "hello",
        engine: "bip-instant",
        usage: { evaluations_count: 1, state_tokens: 1, evaluation_tokens: 2, total_tokens: 3 },
        results: { safe: { type: "noul", noul: 0.9, confidence_tier: "high" } },
      });
    }
    if (parsed.pathname === "/api/v1/engines") {
      return jsonResponse([{ name: "bip-instant", tier: "instant", description: "fast" }]);
    }
    if (parsed.pathname.startsWith("/api/v1/provenance/")) {
      return jsonResponse({ ok: true });
    }
    return jsonResponse({ ok: true });
  };

  const client = new Bipkit({ apiKey: "bpk_live_test", fetch: mockFetch });

  assert.equal((await client.health()).status, "ok");
  const dec = await client.decide({ state: "refund", choices: [{ id: "billing" }] });
  assert.equal(dec.top_choice, "billing");
  assert.equal(shouldEscalate(dec, { minConfidenceTier: "high", maxEntropy: 0.2 }), false);
  assert.equal(shouldEscalate(dec, { maxEntropy: 0.05 }), true);

  const ev = await client.evaluate({ state: "hello", evaluations: { safe: { type: "noul" } } });
  assert.equal(ev.request_id, "req_2");
  assert.equal((await client.engines.list())[0].name, "bip-instant");

  await client.feedback.submit({ request_id: "req_1", verified_decision: "billing", was_accurate: true });
  await client.apiKeys.list();
  await client.apiKeys.create({ name: "ci" });
  await client.apiKeys.rotate("k1", { grace_period_minutes: 5 });
  await client.apiKeys.revoke("k1");
  await client.usage.summary();
  await client.usage.timeseries({ days: 14 });
  await client.provenance.manifest();
  await client.provenance.calibration();
  await client.provenance.keys();
  await client.provenance.recordOutcome({ request_id: "r1", observed_effect: true });
  await client.provenance.recordOutcomesBatch({ items: [{ request_id: "r1", observed_effect: true }] });
  await client.provenance.chain({ from_seq: 0, limit: 10 });
  await client.provenance.metrics();
  await client.provenance.records({ limit: 5 });
  await client.provenance.getRecord("e1");
  await client.provenance.getRequest("r1");
  await client.provenance.export({ request_id: "r1" });
  await client.provenance.verify({ record: {}, manifest: {} });

  assert.equal(seen.length, 23);
});

test("Bipkit TS SDK retries on 429 and maps typed errors", async () => {
  let calls = 0;
  const mockFetch = async () => {
    calls++;
    if (calls === 1) {
      return jsonResponse({ detail: "rate limit" }, 429, { "retry-after": "0" });
    }
    return jsonResponse([{ name: "bip-instant", tier: "instant", description: "fast" }]);
  };

  const client = new Bipkit({ apiKey: "bpk_live_test", maxRetries: 2, fetch: mockFetch });
  const engines = await client.engines.list();
  assert.equal(engines.length, 1);
  assert.equal(calls, 2);

  const fail401 = new Bipkit({
    apiKey: "bad",
    maxRetries: 0,
    fetch: async () => jsonResponse({ detail: "Invalid key" }, 401, { "x-request-id": "req_401" }),
  });
  await assert.rejects(() => fail401.engines.list(), (err) => {
    assert(err instanceof AuthenticationError);
    assert.equal(err.requestId, "req_401");
    return true;
  });

  const fail429 = new Bipkit({
    apiKey: "ok",
    maxRetries: 0,
    fetch: async () => jsonResponse({ detail: "Quota" }, 429, { "retry-after": "5" }),
  });
  await assert.rejects(() => fail429.engines.list(), (err) => {
    assert(err instanceof RateLimitError);
    assert.equal(err.retryAfter, 5);
    return true;
  });
});
