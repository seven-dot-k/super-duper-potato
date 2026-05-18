# Shopper Assistant POC

A mocked multi-agent storefront shopper assistant built with Next.js, the AI SDK,
and Vercel Workflows. 

## Features

- Durable ecommerce storefront assistant agentic chat.
- Product discovery, cart checkout, generic support, post-order returns, and
  human handoff flows.
- Detached cart abandonment workflow with a 60 second debug delay by default.
- Mock adapter boundaries for catalog, cart, orders, returns, policies, CRM,
  personalization, and notifications.
- Guarded workflow debug stream endpoint for inspecting detached child runs.

## Adapter Boundaries

The shopper workflow is intentionally platform-neutral. Mock adapters live behind
interfaces for:

- Catalog search, product details, FAQs, and manuals.
- Cart add/summarize/fulfillment/status.
- Order lookup, details, and cancellation.
- Return eligibility, document review, approval, and label generation.
- Policy lookup.
- CRM handoff.
- Notification and personalization.

These boundaries are the intended future integration points for Shopify,
Salesforce, Klaviyo, custom commerce, CRM, email, or SMS platforms.

## Architecture

```text
Next.js storefront
  |-- /product/[sku] demo product page
  `-- StorefrontChat -> useStorefrontChat -> WorkflowChatTransport

API routes
  |-- POST /api/storefront-chat
  |-- POST /api/storefront-chat/[id]
  |-- GET  /api/storefront-chat/[id]/stream
  `-- GET  /api/workflow-runs/[id]/stream

Workflows
  |-- shopperAssistantWorkflow
  |   |-- triage router
  |   |-- product-discovery agent
  |   |-- cart-checkout agent
  |   |-- generic-support agent
  |   |-- post-order-returns agent
  |   `-- human-handoff agent
  `-- cartAbandonmentWorkflow
      |-- sleep
      |-- evaluate cart status
      |-- build mocked personalized message
      `-- send mocked email/SMS notification
```

## Workflow Notes

- `shopperAssistantWorkflow` owns the live shopper chat session and waits for
  follow-up messages through `chatMessageHook`.
- `cartAbandonmentWorkflow` is started as a detached child workflow after a
  successful mocked `add_to_cart` call.
- The child workflow writes debug lifecycle markers to its own stream:
  `started`, `sleeping`, `evaluating`, `notification_sent` or `skipped`, and
  `completed`.
- The parent chat stream emits a `cart-abandonment-scheduled` marker with the
  child workflow run ID and debug stream URL.
- The debug stream endpoint is enabled outside production. In production, set
  `ENABLE_DEBUG_WORKFLOW_STREAMS=true` to enable it intentionally.

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open the demo storefront at:

```text
http://localhost:3000/product/ELEC-001
```

Useful debug settings:

```bash
SHOPPER_CART_ABANDONMENT_DELAY_MS=60000
ENABLE_DEBUG_WORKFLOW_STREAMS=true
```

## Tests

```bash
npm test -- src/__tests__/workflows/shopper-assistant.test.ts src/__tests__/api/storefront-chat-routes.test.ts src/__tests__/lib/schemas.test.ts
npx eslint src --max-warnings=0
npx tsc --noEmit
```
