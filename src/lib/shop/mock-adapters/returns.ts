import { getOrderById } from "@/lib/mock-data/orders";
import type { ReturnEligibility, ReturnsAdapter } from "@/lib/shop-platform/adapters";

interface MockReturnState {
  returnId: string;
  orderId: string;
  sku?: string;
  reason: string;
  requiredDocs: string[];
  docsAccepted: boolean;
  approved: boolean;
}

const returns = new Map<string, MockReturnState>();

function requiredDocsForStatus(status: string): string[] {
  if (status === "delivered") return ["photo_of_item", "original_packaging_confirmation"];
  if (status === "shipped") return ["return_reason"];
  return [];
}

function approvalRequiredForStatus(status: string): boolean {
  return status === "delivered" || status === "shipped";
}

function buildEligibility(orderId: string, sku?: string): ReturnEligibility | { error: string } {
  const order = getOrderById(orderId);
  if (!order) return { error: `Order ${orderId} not found` };

  const eligibleStatuses = ["shipped", "delivered"];
  const matchingItems = sku
    ? order.items.filter((item) => item.sku === sku)
    : order.items;

  if (matchingItems.length === 0) {
    return {
      orderId,
      eligible: false,
      reason: `No matching item${sku ? ` for SKU ${sku}` : ""} found on order ${orderId}.`,
      eligibleItems: [],
      requiredDocs: [],
      approvalRequired: false,
    };
  }

  if (!eligibleStatuses.includes(order.status)) {
    return {
      orderId,
      eligible: false,
      reason: `Order ${orderId} is ${order.status}; mock returns are available after shipment or delivery.`,
      eligibleItems: [],
      requiredDocs: [],
      approvalRequired: false,
    };
  }

  return {
    orderId,
    eligible: true,
    reason: `Order ${orderId} is eligible for a mocked return.`,
    eligibleItems: matchingItems,
    requiredDocs: requiredDocsForStatus(order.status),
    approvalRequired: approvalRequiredForStatus(order.status),
  };
}

export const mockReturnsAdapter: ReturnsAdapter = {
  async checkEligibility({ orderId, sku }) {
    return buildEligibility(orderId, sku);
  },

  async initiateReturn({ orderId, sku, reason }) {
    const eligibility = buildEligibility(orderId, sku);
    if ("error" in eligibility) return eligibility;
    if (!eligibility.eligible) return { error: eligibility.reason };

    const returnId = `RET-${orderId.replace("ORD-", "")}-${returns.size + 1}`;
    const state: MockReturnState = {
      returnId,
      orderId,
      sku,
      reason,
      requiredDocs: eligibility.requiredDocs,
      docsAccepted: eligibility.requiredDocs.length === 0,
      approved: !eligibility.approvalRequired,
    };
    returns.set(returnId, state);

    return {
      returnId,
      status: "draft",
      requiredDocs: eligibility.requiredDocs,
      message: `Started mocked return ${returnId}.`,
    };
  },

  async requestDocs({ returnId }) {
    const state = returns.get(returnId);
    return {
      returnId,
      requiredDocs: state?.requiredDocs ?? [],
      message: state?.requiredDocs.length
        ? `Please provide: ${state.requiredDocs.join(", ")}.`
        : "No documents are required for this mocked return.",
    };
  },

  async reviewDocs({ returnId, docsProvided }) {
    const state = returns.get(returnId);
    if (state) state.docsAccepted = docsProvided || state.requiredDocs.length === 0;
    return {
      returnId,
      docsAccepted: docsProvided || (state?.requiredDocs.length ?? 0) === 0,
      message: docsProvided ? "Mock return documents accepted." : "Documents are still needed.",
    };
  },

  async requestApproval({ returnId }) {
    const state = returns.get(returnId);
    if (state) state.approved = true;
    return {
      returnId,
      approved: true,
      message: "Mock admin approval granted.",
    };
  },

  async generateLabel({ returnId }) {
    const state = returns.get(returnId);
    if (!state) return { error: `Return ${returnId} not found` };
    if (!state.docsAccepted) return { error: `Return ${returnId} still needs document review` };
    if (!state.approved) return { error: `Return ${returnId} still needs approval` };

    return {
      returnId,
      orderId: state.orderId,
      labelUrl: `https://example.test/returns/${returnId}/label.pdf`,
      status: "label_generated",
      nextStep: "Pack the item, attach the label, and drop it off with the carrier.",
    };
  },
};
