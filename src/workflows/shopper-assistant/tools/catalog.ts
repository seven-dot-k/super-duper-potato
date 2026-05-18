import type { UIMessageChunk } from "ai";
import { getWritable } from "workflow";
import { z } from "zod";
import { shopPlatformAdapter } from "@/lib/shop-platform/adapters";

export const productDiscoveryTools = {
  search_products: {
    description:
      "Search the product catalog by category, keyword, use case, or SKU. Use for product discovery, recommendations, and comparisons.",
    inputSchema: z.object({
      query: z.string().optional().describe("Search phrase, product need, or SKU"),
      category: z.string().optional().describe("Optional product category filter"),
      limit: z.number().int().min(1).max(6).optional(),
      userSegment: z.string().optional().describe("Pricing segment such as student or premium"),
    }),
    execute: async (input: {
      query?: string;
      category?: string;
      limit?: number;
      userSegment?: string;
    }) => {
      "use step";
      const result = await shopPlatformAdapter.catalog.searchProducts(input);

      const writable = getWritable<UIMessageChunk>();
      const writer = writable.getWriter();
      try {
        await writer.write({
          type: "data-workflow",
          data: {
            type: "product-search-results",
            query: input.query,
            category: input.category,
            products: result.products,
            message: result.message,
            timestamp: Date.now(),
          },
        } as UIMessageChunk);
      } finally {
        writer.releaseLock();
      }

      return result;
    },
  },
  get_product_details: {
    description:
      "Get product details and segment-aware price for a SKU. Use before answering specific product questions or adding to cart.",
    inputSchema: z.object({
      sku: z.string().describe("Product SKU, for example ELEC-001"),
      userSegment: z.string().optional().describe("Pricing segment such as student or premium"),
    }),
    execute: async (input: { sku: string; userSegment?: string }) => {
      "use step";
      return shopPlatformAdapter.catalog.getProductDetails(input);
    },
  },
  get_product_faq: {
    description:
      "Get product FAQs and specifications by SKU. Use for compatibility, battery life, feature, or spec questions.",
    inputSchema: z.object({
      sku: z.string().describe("Product SKU, for example ELEC-001"),
    }),
    execute: async (input: { sku: string }) => {
      "use step";
      return shopPlatformAdapter.catalog.getProductFaq(input);
    },
  },
  get_product_manual: {
    description:
      "Get product manual sections by SKU. Use for setup, usage instructions, care, controls, and troubleshooting.",
    inputSchema: z.object({
      sku: z.string().describe("Product SKU, for example ELEC-001"),
    }),
    execute: async (input: { sku: string }) => {
      "use step";
      return shopPlatformAdapter.catalog.getProductManual(input);
    },
  },
};
