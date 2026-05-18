import { beforeEach, describe, expect, it } from "vitest";
import { buildShopperAgentRegistry } from "@/workflows/shopper-assistant/agents";
import {
  evaluateCartAbandonment,
  getCartAbandonmentDelayMs,
} from "@/workflows/cart-abandonment";
import { mockShopperAdapters } from "@/lib/shop/mock-adapters";
import { resetMockCartAdapterForTests } from "@/lib/shop/mock-adapters/cart";
import { classifyShopperIntent } from "@/workflows/shopper-assistant/router";

describe("shopper multi-agent workflow POC", () => {
  beforeEach(() => {
    resetMockCartAdapterForTests();
  });

  it("registers focused shopper specialist agents", () => {
    const registry = buildShopperAgentRegistry();

    expect(Object.keys(registry).sort()).toEqual([
      "cart-checkout",
      "generic-support",
      "human-handoff",
      "post-order-returns",
      "product-discovery",
    ]);
    expect(registry["cart-checkout"].tools).toHaveProperty("add_to_cart");
    expect(registry["product-discovery"].tools).toHaveProperty("search_products");
    expect(registry["post-order-returns"].tools).toHaveProperty("generate_return_label");
    expect(registry["generic-support"].tools).toHaveProperty("policy_search");
    expect(registry["human-handoff"].tools).toHaveProperty("create_handoff");
    expect(registry["product-discovery"].buildSystemPrompt({
      pageContext: {
        url: "http://localhost/product/ELEC-001",
        entity: "product",
        id: "ELEC-001",
      },
      userContext: {
        userId: "11111111-1111-4111-8111-111111111111",
      },
    })).toContain("Current product SKU: ELEC-001");
  });

  it("routes core shopper intents to the expected specialist", () => {
    expect(classifyShopperIntent("add this to my cart").agentId).toBe("cart-checkout");
    expect(classifyShopperIntent("what blue rain jackets do you have?").agentId).toBe("product-discovery");
    expect(classifyShopperIntent("what is your return policy?").agentId).toBe("post-order-returns");
    expect(classifyShopperIntent("how much is shipping?").agentId).toBe("generic-support");
    expect(classifyShopperIntent("I need to speak to a person").agentId).toBe("human-handoff");
  });

  it("keeps cart actions as direct mocked actions", async () => {
    const result = await mockShopperAdapters.cart.addItem({
      sku: "ELEC-001",
      quantity: 1,
      userSegment: "student",
    });

    expect(result.success).toBe(true);
    expect("cartLine" in result ? result.cartLine.sku : undefined).toBe("ELEC-001");
    expect(Object.keys(result)).toEqual(["success", "cartId", "cartLine", "cart", "message"]);
  });

  it("returns product images from mocked catalog search and details", async () => {
    const search = await mockShopperAdapters.catalog.searchProducts({
      query: "headphones",
      limit: 1,
    });

    expect(search.products).toHaveLength(1);
    expect(search.products[0]).toMatchObject({
      sku: "ELEC-001",
      imageUrl: "/mock-products/elec-001.svg",
    });

    const details = await mockShopperAdapters.catalog.getProductDetails({
      sku: "ELEC-001",
    });

    expect(details.product?.imageUrl).toBe("/mock-products/elec-001.svg");
  });

  it("supports a separate mocked cart abandonment workflow evaluation", async () => {
    const added = await mockShopperAdapters.cart.addItem({
      sku: "ELEC-001",
      quantity: 1,
      userSegment: "student",
      preferredChannel: "email",
    });
    if (!added.success) throw new Error("expected cart item to be added");

    expect(getCartAbandonmentDelayMs("2500")).toBe(2500);
    expect(getCartAbandonmentDelayMs("not-a-number")).toBeGreaterThan(0);

    const result = await evaluateCartAbandonment({
      cartId: added.cartId,
      delayMs: 0,
      minimumIdleMs: 0,
    });

    expect(result.status).toBe("sent");
    expect(result.cartId).toBe(added.cartId);
    expect("notificationId" in result ? result.notificationId : "").toMatch(/^NOTIFY-/);
    expect("subject" in result ? result.subject : "").toContain("still in your cart");
    expect("body" in result ? result.body : "").toContain("Resume checkout here");

    const cart = await mockShopperAdapters.cart.getCart({ cartId: added.cartId });
    expect(cart.cart?.status).toBe("abandoned");
  });

  it("skips cart abandonment when the cart is missing, active, or checked out", async () => {
    const missing = await evaluateCartAbandonment({
      cartId: "CART-MISSING",
      delayMs: 0,
      minimumIdleMs: 0,
    });
    expect(missing).toMatchObject({ status: "skipped", reason: "missing_cart" });

    const added = await mockShopperAdapters.cart.addItem({
      sku: "ELEC-002",
      quantity: 1,
    });
    if (!added.success) throw new Error("expected cart item to be added");

    const active = await evaluateCartAbandonment({
      cartId: added.cartId,
      delayMs: 30_000,
      minimumIdleMs: 30_000,
    });
    expect(active).toMatchObject({ status: "skipped", reason: "recent_activity" });

    await mockShopperAdapters.cart.markCheckedOut({ cartId: added.cartId });
    const checkedOut = await evaluateCartAbandonment({
      cartId: added.cartId,
      delayMs: 0,
      minimumIdleMs: 0,
    });
    expect(checkedOut).toMatchObject({ status: "skipped", reason: "already_checked_out" });
  });

  it("provides deterministic mocked policy and CRM adapter responses", async () => {
    const policy = await mockShopperAdapters.policies.searchPolicies({
      query: "shipping",
    });
    const handoff = await mockShopperAdapters.crm.createHandoff({
      reason: "customer asked for a person",
      conversationSummary: "Shopper needs help choosing a product.",
    });

    expect(policy.results[0].topic).toBe("shipping");
    expect(handoff.status).toBe("queued");
    expect(handoff.handoffId).toMatch(/^CRM-/);
  });

  it("supports the mocked return lifecycle through adapter boundaries", async () => {
    const eligibility = await mockShopperAdapters.returns.checkEligibility({
      orderId: "ORD-10001",
    });
    expect("eligible" in eligibility ? eligibility.eligible : false).toBe(true);

    const started = await mockShopperAdapters.returns.initiateReturn({
      orderId: "ORD-10001",
      reason: "Does not fit my setup",
    });
    expect("returnId" in started ? started.returnId : "").toMatch(/^RET-/);
    if (!("returnId" in started)) throw new Error("expected return to start");

    const docs = await mockShopperAdapters.returns.requestDocs({
      returnId: started.returnId,
    });
    expect(docs.requiredDocs.length).toBeGreaterThan(0);

    const reviewed = await mockShopperAdapters.returns.reviewDocs({
      returnId: started.returnId,
      docsProvided: true,
    });
    expect(reviewed.docsAccepted).toBe(true);

    const approval = await mockShopperAdapters.returns.requestApproval({
      returnId: started.returnId,
    });
    expect(approval.approved).toBe(true);

    const label = await mockShopperAdapters.returns.generateLabel({
      returnId: started.returnId,
    });
    expect("labelUrl" in label ? label.labelUrl : "").toContain(started.returnId);
  });
});
