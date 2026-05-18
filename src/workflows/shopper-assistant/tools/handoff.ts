import type { UIMessageChunk } from "ai";
import { getWritable } from "workflow";
import { z } from "zod";
import { shopPlatformAdapter } from "@/lib/shop-platform/adapters";

export const humanHandoffTools = {
  create_handoff: {
    description:
      "Create a mocked CRM handoff for a shopper who needs a person or has an issue outside automation.",
    inputSchema: z.object({
      reason: z.string().describe("Why the shopper needs a human"),
      conversationSummary: z.string().describe("Concise summary for the support agent"),
      customerEmail: z.string().optional().describe("Customer email if the shopper provided it"),
    }),
    execute: async (input: {
      reason: string;
      conversationSummary: string;
      customerEmail?: string;
    }) => {
      "use step";
      const result = await shopPlatformAdapter.crm.createHandoff(input);

      const writable = getWritable<UIMessageChunk>();
      const writer = writable.getWriter();
      try {
        await writer.write({
          type: "data-workflow",
          data: {
            type: "handoff-status",
            handoffId: result.handoffId,
            queue: result.queue,
            status: result.status,
            timestamp: Date.now(),
          },
        } as UIMessageChunk);
      } finally {
        writer.releaseLock();
      }

      return result;
    },
  },
};
