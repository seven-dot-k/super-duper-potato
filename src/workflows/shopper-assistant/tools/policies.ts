import { z } from "zod";
import { shopPlatformAdapter } from "@/lib/shop-platform/adapters";

export const genericSupportTools = {
  policy_search: {
    description:
      "Search mocked storefront policies and support FAQs. Use for return policy, refunds, shipping, warranty, and price-match questions.",
    inputSchema: z.object({
      query: z.string().describe("The shopper policy or FAQ topic to search for"),
    }),
    execute: async (input: { query: string }) => {
      "use step";
      return shopPlatformAdapter.policies.searchPolicies(input);
    },
  },
};
