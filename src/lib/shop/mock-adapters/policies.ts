import { shopperPolicies } from "@/lib/mock-data/policies";
import type { PolicyAdapter } from "@/lib/shop-platform/adapters";

export const mockPolicyAdapter: PolicyAdapter = {
  async searchPolicies({ query }) {
    const normalized = query.trim().toLowerCase();
    const results = shopperPolicies.filter((policy) => {
      const haystack = `${policy.topic} ${policy.content}`.toLowerCase();
      return haystack.includes(normalized) || normalized.includes(policy.topic);
    });

    return {
      results: results.length ? results : shopperPolicies.slice(0, 3),
      message: results.length
        ? `Found ${results.length} matching policy topic(s).`
        : "No exact policy match found; returning the most common support topics.",
    };
  },
};
