import { z } from "zod";

export const orderItemSchema = z.object({
  sku: z.string(),
  name: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
});

export const orderSchema = z.object({
  orderId: z.string(),
  customerName: z.string(),
  customerEmail: z.string(),
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ]),
  items: z.array(orderItemSchema),
  subtotal: z.number(),
  tax: z.number(),
  total: z.number(),
  shippingAddress: z.string(),
  trackingNumber: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type OrderItem = z.infer<typeof orderItemSchema>;
export type Order = z.infer<typeof orderSchema>;
