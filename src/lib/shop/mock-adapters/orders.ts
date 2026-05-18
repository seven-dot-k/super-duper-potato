import { cancelOrder, getOrderById, getOrdersByCustomer } from "@/lib/mock-data/orders";
import type { OrderAdapter } from "@/lib/shop-platform/adapters";

export const mockOrderAdapter: OrderAdapter = {
  async lookupOrders({ orderId, customerEmail }) {
    if (orderId) {
      const order = getOrderById(orderId);
      return {
        orders: order ? [order] : [],
        message: order ? `Found order ${orderId}.` : `No order found with ID ${orderId}.`,
      };
    }

    if (customerEmail) {
      const orders = getOrdersByCustomer(customerEmail);
      return {
        orders,
        message: orders.length
          ? `Found ${orders.length} order(s) for ${customerEmail}.`
          : `No orders found for ${customerEmail}.`,
      };
    }

    return {
      orders: [],
      message: "Provide an order ID or customer email to look up orders.",
    };
  },

  async getOrderDetails({ orderId }) {
    const order = getOrderById(orderId);
    if (!order) return { error: `Order ${orderId} not found` };
    return { order };
  },

  async cancelOrder({ orderId }) {
    const result = cancelOrder(orderId);
    if ("error" in result) return { success: false, error: result.error };
    return { success: true, order: result, message: `Order ${orderId} has been cancelled.` };
  },
};
