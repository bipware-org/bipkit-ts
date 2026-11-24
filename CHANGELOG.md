# Changelog

## [0.1.0] - 2026-11-24

### Added
- Zero-dependency TypeScript/JavaScript SDK (`@bipware/bipkit`) using native `fetch` (Node 18+, Bun, Deno, Edge runtimes).
- Full coverage of all 22 public Bipkit API paths (`evaluate`, `decide`, `feedback`, `engines`, `apiKeys`, `usage`, `provenance`, `health`).
- Exponential backoff + jitter retries with `Retry-After` handling, `AbortSignal` timeouts, and typed error classes.
- Decision-safety helper (`shouldEscalate`).
