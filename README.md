# Bipkit TypeScript SDK (`@bipware-org/bipkit`)

Official, zero-dependency TypeScript/JavaScript SDK for the [Bipkit System One Decision Engine API](https://docs.bipkit.io).

Works natively on **Node 18+**, **Bun**, **Deno**, **Cloudflare Workers**, and **Next.js Edge**.

## Installation

```bash
npm install @bipware-org/bipkit
```

## Quickstart

```ts
import { Bipkit, shouldEscalate } from "@bipware-org/bipkit";

// Reads process.env.BIPKIT_API_KEY by default
const bipkit = new Bipkit();

const decision = await bipkit.decide({
  state: "Customer wants to cancel their enterprise plan and requests a refund.",
  choices: [
    { id: "billing_retention", label: "Billing & Retention" },
    { id: "technical_support", label: "Technical Support" },
    { id: "sales_inquiry", label: "Sales Inquiry" },
  ],
  engine: "bip-cascade",
});

console.log("Top choice:", decision.top_choice);
if (shouldEscalate(decision)) {
  console.log("Low confidence — escalate to System Two LLM");
}
```

## Documentation & Support

- API Documentation: [https://docs.bipkit.io](https://docs.bipkit.io)
- Support: `support@bipware.co.za`
