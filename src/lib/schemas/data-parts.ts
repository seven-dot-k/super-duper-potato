import type { OrderItem } from "./order";

export interface DataOrderInfo {
  type: "data-order-info";
  id: string;
  data: {
    orderId: string;
    customerName: string;
    customerEmail: string;
    status: string;
    items: OrderItem[];
    subtotal: number;
    tax: number;
    total: number;
    shippingAddress: string;
    trackingNumber?: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface DataAgentSwitch {
  type: "data-agent-switch";
  id: string;
  data: {
    agentId: string;
    agentName: string;
    timestamp: number;
  };
}

export interface DataProductSearchResults {
  type: "data-product-search-results";
  id: string;
  data: {
    type: "product-search-results";
    query?: string;
    category?: string;
    products: Array<{
      sku: string;
      name: string;
      category: string;
      imageUrl: string;
      shortDescription: string;
      price: number;
    }>;
    message: string;
    timestamp: number;
  };
}

export interface DataReturnStatus {
  type: "data-return-status";
  id: string;
  data: {
    type: "return-status";
    stage: string;
    timestamp: number;
    orderId?: string;
    returnId?: string;
    eligible?: boolean;
    requiredDocs?: string[];
    docsAccepted?: boolean;
    approved?: boolean;
    labelUrl?: string;
  };
}

export interface DataHandoffStatus {
  type: "data-handoff-status";
  id: string;
  data: {
    type: "handoff-status";
    handoffId: string;
    queue: string;
    status: string;
    timestamp: number;
  };
}

export interface DataCartAbandonmentDebug {
  type: "data-cart-abandonment-debug";
  id: string;
  data: {
    type: "cart-abandonment-debug";
    cartId: string;
    workflowRunId: string;
    stage: "started" | "sleeping" | "evaluating" | "notification_sent" | "skipped" | "completed";
    timestamp: number;
    delayMs?: number;
    status?: "sent" | "skipped";
    reason?: string;
    channel?: "email" | "sms";
    recipient?: string;
    notificationId?: string;
    subject?: string;
    body?: string;
    message?: string;
  };
}

export interface DataCartAbandonmentScheduled {
  type: "data-cart-abandonment-scheduled";
  id: string;
  data: {
    type: "cart-abandonment-scheduled";
    cartId: string;
    workflowRunId: string;
    delayMs: number;
    streamUrl: string;
    timestamp: number;
  };
}

export type CatalogDataPart =
  | DataOrderInfo
  | DataAgentSwitch
  | DataProductSearchResults
  | DataReturnStatus
  | DataHandoffStatus
  | DataCartAbandonmentDebug
  | DataCartAbandonmentScheduled;
