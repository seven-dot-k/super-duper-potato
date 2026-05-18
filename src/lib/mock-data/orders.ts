import type { Order } from "@/lib/schemas/order";

const orders: Order[] = [
  {
    orderId: "ORD-10001",
    customerName: "Alice Johnson",
    customerEmail: "alice@example.com",
    status: "shipped",
    items: [
      { sku: "ELEC-001", name: 'Ultra HD Smart TV 55"', quantity: 1, unitPrice: 799.99 },
      { sku: "ELEC-003", name: "Noise-Canceling Headphones Pro", quantity: 2, unitPrice: 299.99 },
    ],
    subtotal: 1399.97,
    tax: 112.0,
    total: 1511.97,
    shippingAddress: "123 Maple St, Springfield, IL 62701",
    trackingNumber: "1Z999AA10123456784",
    createdAt: "2026-04-10T14:30:00Z",
    updatedAt: "2026-04-12T09:15:00Z",
  },
  {
    orderId: "ORD-10002",
    customerName: "Bob Martinez",
    customerEmail: "bob@example.com",
    status: "processing",
    items: [
      { sku: "SPORT-002", name: "Carbon Fiber Road Bike", quantity: 1, unitPrice: 2499.99 },
    ],
    subtotal: 2499.99,
    tax: 200.0,
    total: 2699.99,
    shippingAddress: "456 Oak Ave, Portland, OR 97201",
    createdAt: "2026-04-15T10:00:00Z",
    updatedAt: "2026-04-15T10:00:00Z",
  },
  {
    orderId: "ORD-10003",
    customerName: "Carol Chen",
    customerEmail: "carol@example.com",
    status: "delivered",
    items: [
      { sku: "HOME-001", name: "Ergonomic Office Chair", quantity: 1, unitPrice: 549.99 },
      { sku: "HOME-003", name: "Standing Desk Converter", quantity: 1, unitPrice: 349.99 },
    ],
    subtotal: 899.98,
    tax: 72.0,
    total: 971.98,
    shippingAddress: "789 Pine Ln, Austin, TX 78701",
    trackingNumber: "1Z999BB20234567891",
    createdAt: "2026-04-01T08:45:00Z",
    updatedAt: "2026-04-05T16:20:00Z",
  },
  {
    orderId: "ORD-10004",
    customerName: "David Kim",
    customerEmail: "david@example.com",
    status: "pending",
    items: [
      { sku: "ELEC-005", name: "Wireless Gaming Mouse", quantity: 3, unitPrice: 79.99 },
    ],
    subtotal: 239.97,
    tax: 19.2,
    total: 259.17,
    shippingAddress: "321 Elm Dr, Seattle, WA 98101",
    createdAt: "2026-04-20T16:00:00Z",
    updatedAt: "2026-04-20T16:00:00Z",
  },
  {
    orderId: "ORD-10005",
    customerName: "Alice Johnson",
    customerEmail: "alice@example.com",
    status: "confirmed",
    items: [
      { sku: "SPORT-001", name: "Trail Running Shoes", quantity: 1, unitPrice: 159.99 },
      { sku: "SPORT-004", name: "Hiking Backpack 40L", quantity: 1, unitPrice: 129.99 },
    ],
    subtotal: 289.98,
    tax: 23.2,
    total: 313.18,
    shippingAddress: "123 Maple St, Springfield, IL 62701",
    createdAt: "2026-04-18T11:30:00Z",
    updatedAt: "2026-04-19T09:00:00Z",
  },
];

export function getOrders(): Order[] {
  return orders;
}

export function getOrderById(orderId: string): Order | undefined {
  return orders.find((o) => o.orderId === orderId);
}

export function getOrdersByCustomer(email: string): Order[] {
  return orders.filter(
    (o) => o.customerEmail.toLowerCase() === email.toLowerCase(),
  );
}

export function cancelOrder(orderId: string): Order | { error: string } {
  const order = orders.find((o) => o.orderId === orderId);
  if (!order) return { error: `Order ${orderId} not found` };

  const cancellable = ["pending", "confirmed", "processing"];
  if (!cancellable.includes(order.status)) {
    return {
      error: `Order ${orderId} cannot be cancelled — status is "${order.status}"`,
    };
  }

  order.status = "cancelled";
  order.updatedAt = new Date().toISOString();
  return order;
}
