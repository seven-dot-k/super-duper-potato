import type { UIMessageChunk } from "ai";
import { getWritable } from "workflow";
import { z } from "zod";
import { shopPlatformAdapter } from "@/lib/shop-platform/adapters";

export const orderTools = {
  lookup_orders: {
    description:
      "Look up customer orders by order ID or customer email for order status, tracking, cancellation, or return questions.",
    inputSchema: z.object({
      orderId: z.string().optional().describe("Order ID, for example ORD-10001"),
      customerEmail: z.string().optional().describe("Customer email address"),
    }),
    execute: async (input: { orderId?: string; customerEmail?: string }) => {
      "use step";
      return shopPlatformAdapter.orders.lookupOrders(input);
    },
  },
  get_order_details: {
    description:
      "Display detailed information for a specific order, including status, totals, items, shipping, and tracking.",
    inputSchema: z.object({
      orderId: z.string().describe("Order ID, for example ORD-10001"),
    }),
    execute: async (input: { orderId: string }) => {
      "use step";
      const result = await shopPlatformAdapter.orders.getOrderDetails(input);
      if (!result.order) return result;

      const writable = getWritable<UIMessageChunk>();
      const writer = writable.getWriter();
      try {
        await writer.write({
          type: "data-workflow",
          data: {
            type: "order-info",
            orderId: result.order.orderId,
            customerName: result.order.customerName,
            customerEmail: result.order.customerEmail,
            status: result.order.status,
            items: result.order.items,
            subtotal: result.order.subtotal,
            tax: result.order.tax,
            total: result.order.total,
            shippingAddress: result.order.shippingAddress,
            trackingNumber: result.order.trackingNumber,
            createdAt: result.order.createdAt,
            updatedAt: result.order.updatedAt,
          },
        } as UIMessageChunk);
      } finally {
        writer.releaseLock();
      }

      return { order: result.order, message: `Order ${input.orderId} details displayed.` };
    },
  },
  cancel_order: {
    description:
      "Cancel an order only after the customer clearly asks to cancel and the order is cancellable.",
    inputSchema: z.object({
      orderId: z.string().describe("Order ID to cancel"),
    }),
    execute: async (input: { orderId: string }) => {
      "use step";
      return shopPlatformAdapter.orders.cancelOrder(input);
    },
  },
};
