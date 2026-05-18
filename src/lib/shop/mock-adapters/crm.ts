import type { CrmAdapter } from "@/lib/shop-platform/adapters";

export const mockCrmAdapter: CrmAdapter = {
  async createHandoff({ reason, conversationSummary, customerEmail }) {
    const idSource = `${reason}-${conversationSummary}-${customerEmail ?? "anonymous"}`;
    const suffix = Math.abs(hashString(idSource)).toString().padStart(6, "0").slice(0, 6);
    return {
      handoffId: `CRM-${suffix}`,
      queue: "storefront-support",
      status: "queued",
      message: `Created mock handoff CRM-${suffix} in storefront-support.`,
    };
  },
};

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
