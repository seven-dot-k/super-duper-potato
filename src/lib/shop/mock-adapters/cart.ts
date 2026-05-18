import { fetchProductSegmentPrice, getProductBySku } from "@/lib/mock-data/products";
import type { CartAdapter, CartLine, CartSession } from "@/lib/shop-platform/adapters";

const DEFAULT_TAX_RATE = 0.08;
const DEFAULT_CART_ID = "CART-DEMO-001";
const DEFAULT_SHOPPER_SESSION_ID = "shopper-demo-session";
const DEFAULT_CUSTOMER_EMAIL = "demo.shopper@example.com";
const DEFAULT_CUSTOMER_PHONE = "+15550101444";

const cartSessions = new Map<string, CartSession>();

function cloneCart(cart: CartSession): CartSession {
  return {
    ...cart,
    lines: cart.lines.map((line) => ({ ...line })),
  };
}

function calculateEstimatedTotal(lines: CartLine[]) {
  return lines.reduce((total, line) => total + line.estimatedTotal, 0);
}

function getOrCreateCart(input: {
  cartId?: string;
  shopperSessionId?: string;
  customerEmail?: string;
  customerPhone?: string;
  preferredChannel?: "email" | "sms";
}) {
  const now = new Date().toISOString();
  const cartId = input.cartId ?? DEFAULT_CART_ID;
  const existing = cartSessions.get(cartId);

  if (existing) {
    existing.shopperSessionId = input.shopperSessionId ?? existing.shopperSessionId;
    existing.customerEmail = input.customerEmail ?? existing.customerEmail;
    existing.customerPhone = input.customerPhone ?? existing.customerPhone;
    existing.preferredChannel = input.preferredChannel ?? existing.preferredChannel;
    existing.updatedAt = now;
    existing.lastActivityAt = now;
    return existing;
  }

  const cart: CartSession = {
    cartId,
    shopperSessionId: input.shopperSessionId ?? DEFAULT_SHOPPER_SESSION_ID,
    status: "active",
    lines: [],
    estimatedTotal: 0,
    customerEmail: input.customerEmail ?? DEFAULT_CUSTOMER_EMAIL,
    customerPhone: input.customerPhone ?? DEFAULT_CUSTOMER_PHONE,
    preferredChannel: input.preferredChannel ?? "email",
    createdAt: now,
    updatedAt: now,
    lastActivityAt: now,
  };

  cartSessions.set(cartId, cart);
  return cart;
}

export const mockCartAdapter: CartAdapter = {
  async addItem({
    sku,
    quantity = 1,
    userSegment,
    cartId,
    shopperSessionId,
    customerEmail,
    customerPhone,
    preferredChannel,
  }) {
    const product = getProductBySku(sku);
    if (!product) {
      return { success: false, error: `No product found for SKU ${sku}` };
    }

    const cart = getOrCreateCart({
      cartId,
      shopperSessionId,
      customerEmail,
      customerPhone,
      preferredChannel,
    });
    const unitPrice = await fetchProductSegmentPrice(sku, userSegment);
    const subtotal = unitPrice * quantity;
    const estimatedTax = subtotal * DEFAULT_TAX_RATE;
    const cartLine = {
      lineId: `line-${cart.lines.length + 1}-${sku}`,
      sku,
      name: product.name,
      quantity,
      unitPrice,
      subtotal,
      estimatedTax,
      estimatedTotal: subtotal + estimatedTax,
    };

    cart.status = "active";
    cart.lines.push(cartLine);
    cart.estimatedTotal = calculateEstimatedTotal(cart.lines);
    cart.updatedAt = new Date().toISOString();
    cart.lastActivityAt = cart.updatedAt;

    return {
      success: true,
      cartId: cart.cartId,
      cartLine,
      cart: cloneCart(cart),
      message: `${quantity} x ${product.name} added to cart.`,
    };
  },

  async getCart({ cartId }) {
    const cart = cartSessions.get(cartId);
    if (!cart) return { error: `No cart found for ${cartId}` };
    return { cart: cloneCart(cart) };
  },

  async summarizeCart(input) {
    const cart = cartSessions.get(input?.cartId ?? DEFAULT_CART_ID);
    const lines = cart?.lines ?? [];
    const estimatedTotal = calculateEstimatedTotal(lines);
    return {
      cartId: cart?.cartId,
      lines: lines.map((line) => ({ ...line })),
      estimatedTotal,
      message: lines.length
        ? `Cart has ${lines.length} line item(s).`
        : "The mock cart is empty.",
    };
  },

  async setFulfillmentInfo({ fulfillmentMethod, postalCode, storeId }) {
    const target = fulfillmentMethod === "pickup" ? `store ${storeId ?? "nearest"}` : postalCode ?? "the provided address";
    return {
      success: true,
      message: `Fulfillment set to ${fulfillmentMethod} for ${target}.`,
    };
  },

  async markAbandoned({ cartId, abandonedAt }) {
    const cart = cartSessions.get(cartId);
    if (!cart) return { success: false, error: `No cart found for ${cartId}` };

    const now = abandonedAt ?? new Date().toISOString();
    cart.status = "abandoned";
    cart.abandonedAt = now;
    cart.updatedAt = now;

    return {
      success: true,
      cart: cloneCart(cart),
      message: `Cart ${cartId} marked abandoned.`,
    };
  },

  async markCheckedOut({ cartId }) {
    const cart = cartSessions.get(cartId);
    if (!cart) return { success: false, error: `No cart found for ${cartId}` };

    cart.status = "checked_out";
    cart.updatedAt = new Date().toISOString();

    return {
      success: true,
      cart: cloneCart(cart),
      message: `Cart ${cartId} marked checked out.`,
    };
  },

  async recordAbandonmentWorkflow({ cartId, workflowRunId }) {
    const cart = cartSessions.get(cartId);
    if (!cart) {
      return { success: false, message: `No cart found for ${cartId}` };
    }

    cart.abandonmentWorkflowRunId = workflowRunId;
    cart.updatedAt = new Date().toISOString();

    return {
      success: true,
      message: `Recorded cart abandonment workflow ${workflowRunId} for ${cartId}.`,
    };
  },
};

export function resetMockCartAdapterForTests() {
  cartSessions.clear();
}
