import type { Order, OrderItem } from "@/lib/schemas/order";

export interface ShopperProductSummary {
  sku: string;
  name: string;
  category: string;
  imageUrl: string;
  shortDescription: string;
  price: number;
}

export interface ShopperProductDetails extends ShopperProductSummary {
  longDescription: string;
}

export interface ProductKnowledge {
  sku: string;
  faqs: Array<{ question: string; answer: string }>;
  specifications: Record<string, string>;
}

export interface ProductManual {
  sku: string;
  manual: Array<{ title: string; content: string }>;
}

export interface CatalogAdapter {
  searchProducts(input: {
    query?: string;
    category?: string;
    limit?: number;
    userSegment?: string;
  }): Promise<{ products: ShopperProductSummary[]; message: string }>;
  getProductDetails(input: {
    sku: string;
    userSegment?: string;
  }): Promise<{ product?: ShopperProductDetails; error?: string }>;
  getProductFaq(input: {
    sku: string;
  }): Promise<ProductKnowledge | { error: string }>;
  getProductManual(input: {
    sku: string;
  }): Promise<ProductManual | { error: string }>;
}

export interface CartLine {
  lineId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  estimatedTax: number;
  estimatedTotal: number;
}

export type CartStatus = "active" | "checked_out" | "abandoned";

export interface CartSession {
  cartId: string;
  shopperSessionId: string;
  status: CartStatus;
  lines: CartLine[];
  estimatedTotal: number;
  customerEmail?: string;
  customerPhone?: string;
  preferredChannel: "email" | "sms";
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  abandonmentWorkflowRunId?: string;
  abandonedAt?: string;
}

export interface CartAdapter {
  addItem(input: {
    sku: string;
    quantity?: number;
    userSegment?: string;
    cartId?: string;
    shopperSessionId?: string;
    customerEmail?: string;
    customerPhone?: string;
    preferredChannel?: "email" | "sms";
  }): Promise<{ success: true; cartId: string; cartLine: CartLine; cart: CartSession; message: string } | { success: false; error: string }>;
  getCart(input: { cartId: string }): Promise<{ cart?: CartSession; error?: string }>;
  summarizeCart(input?: { cartId?: string }): Promise<{ cartId?: string; lines: CartLine[]; estimatedTotal: number; message: string }>;
  setFulfillmentInfo(input: {
    fulfillmentMethod: "ship" | "pickup";
    postalCode?: string;
    storeId?: string;
  }): Promise<{ success: boolean; message: string }>;
  markAbandoned(input: {
    cartId: string;
    abandonedAt?: string;
  }): Promise<{ success: true; cart: CartSession; message: string } | { success: false; error: string }>;
  markCheckedOut(input: {
    cartId: string;
  }): Promise<{ success: true; cart: CartSession; message: string } | { success: false; error: string }>;
  recordAbandonmentWorkflow(input: {
    cartId: string;
    workflowRunId: string;
  }): Promise<{ success: boolean; message: string }>;
}

export interface OrderAdapter {
  lookupOrders(input: {
    orderId?: string;
    customerEmail?: string;
  }): Promise<{ orders: Order[]; message: string }>;
  getOrderDetails(input: { orderId: string }): Promise<{ order?: Order; error?: string }>;
  cancelOrder(input: { orderId: string }): Promise<{ success: true; order: Order; message: string } | { success: false; error: string }>;
}

export interface ReturnEligibility {
  orderId: string;
  eligible: boolean;
  reason: string;
  eligibleItems: OrderItem[];
  requiredDocs: string[];
  approvalRequired: boolean;
}

export interface ReturnLabel {
  returnId: string;
  orderId: string;
  labelUrl: string;
  status: "label_generated";
  nextStep: string;
}

export interface ReturnsAdapter {
  checkEligibility(input: {
    orderId: string;
    sku?: string;
  }): Promise<ReturnEligibility | { error: string }>;
  initiateReturn(input: {
    orderId: string;
    sku?: string;
    reason: string;
  }): Promise<{ returnId: string; status: "draft"; requiredDocs: string[]; message: string } | { error: string }>;
  requestDocs(input: {
    returnId: string;
  }): Promise<{ returnId: string; requiredDocs: string[]; message: string }>;
  reviewDocs(input: {
    returnId: string;
    docsProvided: boolean;
  }): Promise<{ returnId: string; docsAccepted: boolean; message: string }>;
  requestApproval(input: {
    returnId: string;
  }): Promise<{ returnId: string; approved: boolean; message: string }>;
  generateLabel(input: {
    returnId: string;
  }): Promise<ReturnLabel | { error: string }>;
}

export interface PolicyAdapter {
  searchPolicies(input: {
    query: string;
  }): Promise<{ results: Array<{ topic: string; content: string }>; message: string }>;
}

export interface CrmAdapter {
  createHandoff(input: {
    reason: string;
    conversationSummary: string;
    customerEmail?: string;
  }): Promise<{ handoffId: string; queue: string; status: "queued"; message: string }>;
}

export interface CartAbandonmentMessage {
  subject: string;
  emailBody: string;
  smsBody: string;
}

export interface PersonalizationAdapter {
  buildCartAbandonmentMessage(input: {
    cart: CartSession;
  }): Promise<CartAbandonmentMessage>;
}

export interface NotificationAdapter {
  sendCartAbandonmentNotification(input: {
    cartId: string;
    channel: "email" | "sms";
    recipient: string;
    subject?: string;
    body: string;
  }): Promise<{
    notificationId: string;
    status: "sent";
    channel: "email" | "sms";
    recipient: string;
    subject?: string;
    body: string;
    message: string;
  }>;
}

export interface ShopperPlatformAdapters {
  catalog: CatalogAdapter;
  cart: CartAdapter;
  orders: OrderAdapter;
  returns: ReturnsAdapter;
  policies: PolicyAdapter;
  crm: CrmAdapter;
  personalization: PersonalizationAdapter;
  notifications: NotificationAdapter;
}
