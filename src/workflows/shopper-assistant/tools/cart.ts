import type { UIMessageChunk } from "ai";
import { getWritable } from "workflow";
import { z } from "zod";
import { shopPlatformAdapter } from "@/lib/shop-platform/adapters";
import { scheduleCartAbandonmentWorkflow } from "@/workflows/cart-abandonment";

export const cartCheckoutTools = {
  add_to_cart: {
    description:
      "Add a product to the customer's cart. This is a mocked cart action only.",
    inputSchema: z.object({
      sku: z.string().describe("Product SKU to add to cart"),
      quantity: z.number().int().min(1).max(10).optional(),
      userSegment: z.string().optional().describe("Pricing segment such as student or premium"),
      cartId: z.string().optional().describe("Existing cart id when continuing a cart session"),
      customerEmail: z.string().email().optional().describe("Optional mocked email recipient for follow-up workflows"),
      customerPhone: z.string().optional().describe("Optional mocked SMS recipient for follow-up workflows"),
      preferredChannel: z.enum(["email", "sms"]).optional().describe("Preferred mocked follow-up channel"),
    }),
    execute: async (input: {
      sku: string;
      quantity?: number;
      userSegment?: string;
      cartId?: string;
      customerEmail?: string;
      customerPhone?: string;
      preferredChannel?: "email" | "sms";
    }) => {
      "use step";
      const result = await shopPlatformAdapter.cart.addItem(input);
      if (!result.success) return result;

      const cartAbandonment = await scheduleCartAbandonmentWorkflow({
        cartId: result.cartId,
        shopperSessionId: result.cart.shopperSessionId,
      });

      if (cartAbandonment.scheduled) {
        const writable = getWritable<UIMessageChunk>();
        const writer = writable.getWriter();
        try {
          await writer.write({
            type: "data-workflow",
            data: {
              type: "cart-abandonment-scheduled",
              cartId: cartAbandonment.cartId,
              workflowRunId: cartAbandonment.runId,
              delayMs: cartAbandonment.delayMs,
              streamUrl: `/api/workflow-runs/${encodeURIComponent(cartAbandonment.runId)}/stream`,
              timestamp: Date.now(),
            },
          } as UIMessageChunk);
        } finally {
          writer.releaseLock();
        }
      }

      return {
        ...result,
        cartAbandonment,
      };
    },
  },
  summarize_cart: {
    description: "Summarize the current mocked cart contents and estimated total.",
    inputSchema: z.object({}),
    execute: async () => {
      "use step";
      return shopPlatformAdapter.cart.summarizeCart();
    },
  },
  set_fulfillment_info: {
    description:
      "Set mocked fulfillment information for checkout, such as shipping or pickup preference.",
    inputSchema: z.object({
      fulfillmentMethod: z.enum(["ship", "pickup"]),
      postalCode: z.string().optional(),
      storeId: z.string().optional(),
    }),
    execute: async (input: {
      fulfillmentMethod: "ship" | "pickup";
      postalCode?: string;
      storeId?: string;
    }) => {
      "use step";
      return shopPlatformAdapter.cart.setFulfillmentInfo(input);
    },
  },
};
